using System;
using System.IO;
using System.Linq;
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

    [Fact] public void One_deposit_remains_an_individual_credit() { var (store, partner, path)=CreateStore(); try { var result=store.Get(partner); var deposits=result.Credits.Where(x=>x.DocumentType=="Depósito bancario").ToArray(); Assert.Equal(2,deposits.Length); Assert.All(deposits,x=>Assert.Equal(30000m,x.AvailableAmount)); } finally { File.Delete(path); } }
    [Fact] public void Two_deposits_total_sixty_thousand_without_double_counting() { var (store, partner, path)=CreateStore(); try { var result=store.Get(partner); var total=result.Credits.Where(x=>x.DocumentType=="Depósito bancario").Sum(x=>x.AvailableAmount); Assert.Equal(60000m,total); Assert.Equal(374262.58m,result.TotalAvailableCredit); } finally { File.Delete(path); } }
    [Fact] public void Previous_balance_plus_one_deposit_is_individual_sum() { var (store, partner, path)=CreateStore(); try { var result=store.Get(partner); var total=result.Credits.Take(2).Sum(x=>x.AvailableAmount); Assert.Equal(344262.58m,total); } finally { File.Delete(path); } }
    [Fact] public void Partial_credit_application_keeps_credit_remainder() { var (store, partner, path)=CreateStore(); try { var result=store.Get(partner); var invoice=Guid.Parse(result.Invoices[0].Id); var credit=Guid.Parse(result.Credits[0].Id); var execution=store.Execute(partner,partner,invoice,new[]{credit}); var after=store.Get(partner); Assert.Equal(17666.40m,execution.CreditApplied); Assert.Equal(296596.18m,after.Credits.Single(x=>x.Id==credit.ToString()).AvailableAmount); } finally { File.Delete(path); } }
    [Fact] public void Cannot_consume_same_credit_twice() { var (store, partner, path)=CreateStore(); try { var result=store.Get(partner); var invoice=Guid.Parse(result.Invoices[0].Id); var credit=Guid.Parse(result.Credits[0].Id); store.Execute(partner,partner,invoice,new[]{credit}); Assert.Throws<InvalidOperationException>(()=>store.Execute(partner,partner,invoice,new[]{credit})); } finally { File.Delete(path); } }
    [Fact] public async Task Concurrent_consumption_allows_only_one_operation() { var (store, partner, path)=CreateStore(); try { var result=store.Get(partner); var invoice=Guid.Parse(result.Invoices[0].Id); var credit=Guid.Parse(result.Credits[0].Id); var tasks=Enumerable.Range(0,2).Select(_=>Task.Run(()=>Record.Exception(()=>store.Execute(partner,partner,invoice,new[]{credit})))).ToArray(); var errors=await Task.WhenAll(tasks); Assert.Equal(1,errors.Count(x=>x is null)); Assert.Equal(1,errors.Count(x=>x is InvalidOperationException)); } finally { File.Delete(path); } }
    [Fact] public void Header_balance_equals_sum_of_available_credits() { var (store, partner, path)=CreateStore(); try { var result=store.Get(partner); Assert.Equal(result.TotalAvailableCredit,result.Credits.Sum(x=>x.AvailableAmount)); } finally { File.Delete(path); } }
}
