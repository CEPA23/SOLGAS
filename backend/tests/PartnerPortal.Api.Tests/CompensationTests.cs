using System.IO;
using System.Linq;
using System;
using System.Threading.Tasks;
using PartnerPortal.Api.Infrastructure;
using Xunit;

namespace PartnerPortal.Api.Tests;

public sealed class CompensationTests
{
    private static (CompensationStore Store, Guid PartnerId, string Path) CreateStore()
    {
        var path = Path.Combine(Path.GetTempPath(), $"compensation-{Guid.NewGuid():N}.db");
        var partner = Guid.NewGuid(); var store = new CompensationStore(path); store.SeedDemoData(partner); return (store, partner, path);
    }
    private static void Cleanup(string path) { if (File.Exists(path)) File.Delete(path); }

    [Fact] public void Header_balance_is_sum_of_individual_available_credits_and_debt_is_calculated()
    { var (store,p,path)=CreateStore(); try { var result=store.Get(p); Assert.Equal(374000m,result.TotalAvailableCredit); Assert.Equal(40000m,result.TotalDebt); Assert.Equal(0m,result.OverdueDebt); Assert.Equal(result.TotalAvailableCredit,result.Credits.Sum(x=>x.AvailableAmount)); } finally { Cleanup(path); } }

    [Fact] public void Two_invoices_are_compensated_in_one_transaction()
    { var (store,p,path)=CreateStore(); try { var before=store.Get(p); var result=store.Execute(p,p,before.Invoices.Select(x=>Guid.Parse(x.Id)).ToArray(),null,"Prueba de compensación",Guid.NewGuid().ToString("N")); var after=store.Get(p); Assert.Equal(40000m,result.AppliedAmount); Assert.Equal(334000m,result.ResultingCreditBalance); Assert.Equal(0m,after.TotalDebt); Assert.Empty(after.Invoices); } finally { Cleanup(path); } }

    [Fact] public void One_invoice_updates_balance_and_keeps_the_other_pending()
    { var (store,p,path)=CreateStore(); try { var before=store.Get(p); store.Execute(p,p,new[]{Guid.Parse(before.Invoices[0].Id)},null,null,Guid.NewGuid().ToString("N")); var after=store.Get(p); Assert.Equal(354000m,after.TotalAvailableCredit); Assert.Equal(20000m,after.TotalDebt); Assert.Single(after.Invoices); } finally { Cleanup(path); } }

    [Fact] public void Selected_credit_ids_are_consumed_individually_without_double_counting()
    { var (store,p,path)=CreateStore(); try { var before=store.Get(p); var depositIds=before.Credits.Where(x=>x.DocumentType=="Depósito bancario").Select(x=>Guid.Parse(x.Id)).ToArray(); store.Execute(p,p,new[]{Guid.Parse(before.Invoices[0].Id)},new[]{depositIds[0]},null,Guid.NewGuid().ToString("N")); var after=store.Get(p); Assert.Equal(354000m,after.TotalAvailableCredit); Assert.Single(after.Credits); Assert.Equal(354000m,after.Credits[0].AvailableAmount); } finally { Cleanup(path); } }

    [Fact] public void Repeating_the_same_idempotency_key_does_not_apply_twice()
    { var (store,p,path)=CreateStore(); try { var before=store.Get(p); var key=Guid.NewGuid().ToString("N"); var first=store.Execute(p,p,new[]{Guid.Parse(before.Invoices[0].Id)},null,null,key); var second=store.Execute(p,p,new[]{Guid.Parse(before.Invoices[0].Id)},null,null,key); Assert.Equal(first.Id,second.Id); Assert.Equal(first.ResultingCreditBalance,second.ResultingCreditBalance); } finally { Cleanup(path); } }

    [Fact] public async Task Concurrent_requests_cannot_consume_the_same_invoice_twice()
    { var (store,p,path)=CreateStore(); try { var invoice=Guid.Parse(store.Get(p).Invoices[0].Id); var tasks=Enumerable.Range(0,2).Select(_=>Task.Run(()=>Record.Exception(()=>store.Execute(p,p,new[]{invoice},null,null,Guid.NewGuid().ToString("N"))))).ToArray(); var errors=await Task.WhenAll(tasks); Assert.Equal(1,errors.Count(x=>x is null)); Assert.Equal(1,errors.Count(x=>x is InvalidOperationException)); } finally { Cleanup(path); } }

    [Fact] public void Insufficient_selected_credit_is_rejected_without_changing_balance()
    { var (store,p,path)=CreateStore(); try { var before=store.Get(p); var invoices=before.Invoices.Select(x=>Guid.Parse(x.Id)).ToArray(); var smallCredit=Guid.Parse(before.Credits.First(x=>x.DocumentType=="Depósito bancario").Id); var error=Assert.Throws<InvalidOperationException>(()=>store.Execute(p,p,invoices,new[]{smallCredit},null,Guid.NewGuid().ToString("N"))); Assert.Contains("no es suficiente",error.Message); Assert.Equal(before.TotalAvailableCredit,store.Get(p).TotalAvailableCredit); } finally { Cleanup(path); } }

    [Fact] public void Empty_invoice_selection_is_rejected()
    { var (store,p,path)=CreateStore(); try { var error=Assert.Throws<InvalidOperationException>(()=>store.Execute(p,p,Array.Empty<Guid>(),null,null,Guid.NewGuid().ToString("N"))); Assert.Contains("al menos una factura",error.Message); } finally { Cleanup(path); } }

    [Fact] public void Invoice_from_another_partner_is_rejected()
    { var (store,p,path)=CreateStore(); try { var other=Guid.NewGuid(); store.SeedDemoData(other); var foreignInvoice=Guid.Parse(store.Get(other).Invoices[0].Id); var error=Assert.Throws<InvalidOperationException>(()=>store.Execute(p,p,new[]{foreignInvoice},null,null,Guid.NewGuid().ToString("N"))); Assert.Contains("no existe o no pertenece",error.Message); } finally { Cleanup(path); } }

    [Fact] public void Already_compensated_invoice_cannot_be_used_again()
    { var (store,p,path)=CreateStore(); try { var invoice=Guid.Parse(store.Get(p).Invoices[0].Id); store.Execute(p,p,new[]{invoice},null,null,Guid.NewGuid().ToString("N")); var error=Assert.Throws<InvalidOperationException>(()=>store.Execute(p,p,new[]{invoice},null,null,Guid.NewGuid().ToString("N"))); Assert.Contains("ya no está pendiente",error.Message); } finally { Cleanup(path); } }

    [Fact] public void Two_deposits_remain_separate_documents()
    { var (store,p,path)=CreateStore(); try { var deposits=store.Get(p).Credits.Where(x=>x.DocumentType=="Depósito bancario").ToArray(); Assert.Equal(2,deposits.Length); Assert.All(deposits,x=>Assert.Equal(30000m,x.AvailableAmount)); Assert.Equal(60000m,deposits.Sum(x=>x.AvailableAmount)); } finally { Cleanup(path); } }

    [Fact] public void History_contains_the_balance_audit_record()
    { var (store,p,path)=CreateStore(); try { var invoice=Guid.Parse(store.Get(p).Invoices[0].Id); var response=store.Execute(p,p,new[]{invoice},null,"Factura de prueba",Guid.NewGuid().ToString("N")); var history=store.History(p); var entry=Assert.Single(history); Assert.Equal(response.Id,entry.Id); Assert.Equal(374000m,entry.PreviousCreditBalance); Assert.Equal(354000m,entry.ResultingCreditBalance); Assert.Equal("Factura de prueba",entry.Observation); } finally { Cleanup(path); } }
}
