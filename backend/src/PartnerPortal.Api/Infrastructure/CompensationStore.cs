using System.Text.Json;
using Microsoft.Data.Sqlite;
using PartnerPortal.Api.Application;

namespace PartnerPortal.Api.Infrastructure;

public sealed class CompensationStore
{
    private readonly string connectionString;
    private readonly object sync = new();

    public CompensationStore(IConfiguration configuration) : this(configuration["Compensation:DatabasePath"] ?? Path.Combine(AppContext.BaseDirectory, "data", "compensation.db")) { }
    public CompensationStore(string path)
    {
        if (path != ":memory:") Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        connectionString = path == ":memory:" ? "Data Source=:memory:;Pooling=False" : $"Data Source={path};Pooling=False";
        using var connection = Open(); EnsureSchema(connection);
    }
    private SqliteConnection Open() { var c = new SqliteConnection(connectionString); c.Open(); return c; }

    private static void EnsureSchema(SqliteConnection c)
    {
        using var cmd = c.CreateCommand(); cmd.CommandText = """
        CREATE TABLE IF NOT EXISTS Invoices(Id TEXT PRIMARY KEY, PartnerId TEXT NOT NULL, Reference TEXT NOT NULL, TotalAmount NUMERIC NOT NULL, PendingAmount NUMERIC NOT NULL);
        CREATE TABLE IF NOT EXISTS Credits(Id TEXT PRIMARY KEY, PartnerId TEXT NOT NULL, Reference TEXT NOT NULL, DocumentType TEXT NOT NULL, DocumentDate TEXT NOT NULL, OriginalAmount NUMERIC NOT NULL, AvailableAmount NUMERIC NOT NULL);
        CREATE TABLE IF NOT EXISTS CreditApplications(Id TEXT PRIMARY KEY, CreditId TEXT NOT NULL, InvoiceId TEXT NOT NULL, PartnerId TEXT NOT NULL, Amount NUMERIC NOT NULL, AppliedAt TEXT NOT NULL, AppliedBy TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS Compensations(Id TEXT PRIMARY KEY, PartnerId TEXT NOT NULL, PreviousCreditBalance NUMERIC NOT NULL, AppliedAmount NUMERIC NOT NULL, ResultingCreditBalance NUMERIC NOT NULL, Status TEXT NOT NULL, CreatedBy TEXT NOT NULL, CreatedAt TEXT NOT NULL, Observation TEXT NOT NULL, IdempotencyKey TEXT NOT NULL, ResultJson TEXT NOT NULL DEFAULT '');
        CREATE TABLE IF NOT EXISTS CompensationInvoices(Id TEXT PRIMARY KEY, CompensationId TEXT NOT NULL, InvoiceId TEXT NOT NULL, PreviousPendingAmount NUMERIC NOT NULL, AppliedAmount NUMERIC NOT NULL, ResultingPendingAmount NUMERIC NOT NULL);
        CREATE TABLE IF NOT EXISTS CreditBalanceMovements(Id TEXT PRIMARY KEY, PartnerId TEXT NOT NULL, MovementType TEXT NOT NULL, Amount NUMERIC NOT NULL, PreviousBalance NUMERIC NOT NULL, ResultingBalance NUMERIC NOT NULL, ReferenceType TEXT NOT NULL, ReferenceId TEXT NOT NULL, CreatedBy TEXT NOT NULL, CreatedAt TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS IX_Credits_Partner ON Credits(PartnerId);
        CREATE INDEX IF NOT EXISTS IX_Applications_Credit ON CreditApplications(CreditId);
        CREATE UNIQUE INDEX IF NOT EXISTS UX_Compensations_Idempotency ON Compensations(PartnerId, IdempotencyKey);
        """; cmd.ExecuteNonQuery();
        AddColumnIfMissing(c, "Invoices", "IssueDate", "TEXT NOT NULL DEFAULT '2026-08-11T00:00:00.0000000Z'");
        AddColumnIfMissing(c, "Invoices", "DueDate", "TEXT NOT NULL DEFAULT '2026-08-30T00:00:00.0000000Z'");
        AddColumnIfMissing(c, "Invoices", "Status", "TEXT NOT NULL DEFAULT 'PENDING'");
    }
    private static void AddColumnIfMissing(SqliteConnection c, string table, string column, string definition)
    {
        using var check = c.CreateCommand(); check.CommandText = $"PRAGMA table_info({table})"; using var reader = check.ExecuteReader(); while (reader.Read()) if (string.Equals(reader.GetString(1), column, StringComparison.OrdinalIgnoreCase)) return;
        using var alter = c.CreateCommand(); alter.CommandText = $"ALTER TABLE {table} ADD COLUMN {column} {definition}"; alter.ExecuteNonQuery();
    }

    public void SeedDemoData(Guid partnerId)
    {
        lock (sync)
        {
            using var c = Open(); using var tx = c.BeginTransaction(); using var exists = c.CreateCommand(); exists.Transaction = tx; exists.CommandText = "SELECT COUNT(*) FROM Credits WHERE PartnerId=$p"; exists.Parameters.AddWithValue("$p", partnerId.ToString());
            if (Convert.ToInt32(exists.ExecuteScalar()) == 0)
            {
                InsertInvoice(c, tx, partnerId, "01-F326-00085995", new DateTime(2026, 8, 11), new DateTime(2026, 8, 30), 20000m);
                InsertInvoice(c, tx, partnerId, "01-F326-00085996", new DateTime(2026, 8, 12), new DateTime(2026, 8, 31), 20000m);
                InsertCredit(c, tx, partnerId, "Sin ref.", "Saldo a favor", new DateTime(2026, 8, 11), 314000m);
                InsertCredit(c, tx, partnerId, "SALDO-A-FAVOR", "Depósito bancario", new DateTime(2026, 8, 13), 30000m);
                InsertCredit(c, tx, partnerId, "SALDO-A-FAVOR", "Depósito bancario", new DateTime(2026, 8, 13), 30000m);
            }
            tx.Commit();
        }
    }
    private static void InsertInvoice(SqliteConnection c, SqliteTransaction tx, Guid partnerId, string reference, DateTime issue, DateTime due, decimal amount) { using var cmd=c.CreateCommand(); cmd.Transaction=tx; cmd.CommandText="INSERT INTO Invoices(Id,PartnerId,Reference,TotalAmount,PendingAmount,IssueDate,DueDate,Status) VALUES($id,$p,$r,$t,$t,$issue,$due,'PENDING')"; cmd.Parameters.AddWithValue("$id",Guid.NewGuid().ToString()); cmd.Parameters.AddWithValue("$p",partnerId.ToString()); cmd.Parameters.AddWithValue("$r",reference); cmd.Parameters.AddWithValue("$t",amount); cmd.Parameters.AddWithValue("$issue",issue.ToString("O")); cmd.Parameters.AddWithValue("$due",due.ToString("O")); cmd.ExecuteNonQuery(); }
    private static void InsertCredit(SqliteConnection c, SqliteTransaction tx, Guid partnerId, string reference, string type, DateTime date, decimal amount) { using var cmd=c.CreateCommand(); cmd.Transaction=tx; cmd.CommandText="INSERT INTO Credits VALUES($id,$p,$r,$t,$d,$o,$o)"; cmd.Parameters.AddWithValue("$id",Guid.NewGuid().ToString()); cmd.Parameters.AddWithValue("$p",partnerId.ToString()); cmd.Parameters.AddWithValue("$r",reference); cmd.Parameters.AddWithValue("$t",type); cmd.Parameters.AddWithValue("$d",date.ToString("O")); cmd.Parameters.AddWithValue("$o",amount); cmd.ExecuteNonQuery(); }

    public CompensationResponse Get(Guid partnerId)
    {
        lock (sync)
        {
            using var c=Open(); var today=DateTime.UtcNow.Date; var invoices=new List<CompensationInvoiceResponse>();
            using(var cmd=c.CreateCommand()) { cmd.CommandText="SELECT Id,Reference,IssueDate,DueDate,TotalAmount,PendingAmount,Status FROM Invoices WHERE PartnerId=$p AND PendingAmount>0 AND Status NOT IN ('PAID','CANCELLED','COMPENSATED') ORDER BY DueDate,Id"; cmd.Parameters.AddWithValue("$p",partnerId.ToString()); using var r=cmd.ExecuteReader(); while(r.Read()){var due=DateTime.Parse(r.GetString(3)); invoices.Add(new(r.GetString(0),r.GetString(1),DateTime.Parse(r.GetString(2)),due,r.GetDecimal(4),r.GetDecimal(5),r.GetString(6),due.Date<today));} }
            var credits=new List<CompensationCreditResponse>(); using(var cmd=c.CreateCommand()){cmd.CommandText="SELECT Id,Reference,DocumentType,DocumentDate,OriginalAmount,AvailableAmount FROM Credits WHERE PartnerId=$p AND AvailableAmount>0 ORDER BY DocumentDate,Id";cmd.Parameters.AddWithValue("$p",partnerId.ToString());using var r=cmd.ExecuteReader();while(r.Read())credits.Add(new(r.GetString(0),r.GetString(1),r.GetString(2),DateTime.Parse(r.GetString(3)),r.GetDecimal(4),r.GetDecimal(5)));}
            DateTime? lastCompensation = null; using (var cmd=c.CreateCommand()) { cmd.CommandText="SELECT MAX(CreatedAt) FROM Compensations WHERE PartnerId=$p"; cmd.Parameters.AddWithValue("$p",partnerId.ToString()); var value=cmd.ExecuteScalar() as string; if(!string.IsNullOrWhiteSpace(value)) lastCompensation=DateTime.Parse(value); }
            if (lastCompensation is not null && credits.Count > 0) { var total=credits.Sum(x=>x.AvailableAmount); credits=new List<CompensationCreditResponse> { new(Guid.Empty.ToString(),"Sin ref.","Saldo a favor",lastCompensation.Value,total,total) }; }
            return new(credits.Sum(x=>x.AvailableAmount),invoices.Sum(x=>x.PendingAmount),invoices.Where(x=>x.IsOverdue).Sum(x=>x.PendingAmount),invoices,credits);
        }
    }

    public CompensationExecutionResponse Execute(Guid partnerId, Guid appliedBy, IReadOnlyCollection<Guid> invoiceIds, IReadOnlyCollection<Guid>? creditIds, string? observation, string idempotencyKey)
    {
        if(invoiceIds.Count==0) throw new InvalidOperationException("Debe seleccionar al menos una factura."); if(string.IsNullOrWhiteSpace(idempotencyKey)||idempotencyKey.Length>100) throw new InvalidOperationException("La clave de idempotencia no es válida.");
        lock(sync)
        {
            using var c=Open(); using var tx=c.BeginTransaction(); using(var existing=c.CreateCommand()){existing.Transaction=tx;existing.CommandText="SELECT ResultJson FROM Compensations WHERE PartnerId=$p AND IdempotencyKey=$k";existing.Parameters.AddWithValue("$p",partnerId.ToString());existing.Parameters.AddWithValue("$k",idempotencyKey);var json=existing.ExecuteScalar() as string;if(!string.IsNullOrEmpty(json))return JsonSerializer.Deserialize<CompensationExecutionResponse>(json)!;}
            var invoiceRows=new List<(Guid Id,decimal Pending)>(); foreach(var id in invoiceIds.Distinct()){using var cmd=c.CreateCommand();cmd.Transaction=tx;cmd.CommandText="SELECT PendingAmount,Status FROM Invoices WHERE Id=$i AND PartnerId=$p";cmd.Parameters.AddWithValue("$i",id.ToString());cmd.Parameters.AddWithValue("$p",partnerId.ToString());using var r=cmd.ExecuteReader();if(!r.Read())throw new InvalidOperationException("Una de las facturas no existe o no pertenece al cliente.");var pending=r.GetDecimal(0);var status=r.GetString(1);if(pending<=0||status is "PAID" or "CANCELLED" or "COMPENSATED")throw new InvalidOperationException("Una de las facturas ya no está pendiente.");invoiceRows.Add((id,pending));}
            var previous=ScalarDecimal(c,tx,"SELECT COALESCE(SUM(AvailableAmount),0) FROM Credits WHERE PartnerId=$p AND AvailableAmount>0",("$p",partnerId.ToString())); var ids=creditIds is null||creditIds.Count==0||creditIds.Contains(Guid.Empty)?null:creditIds.Distinct().ToArray(); var credits=new List<(Guid Id,decimal Available)>();
            using(var cmd=c.CreateCommand()){cmd.Transaction=tx;cmd.CommandText=ids is null?"SELECT Id,AvailableAmount FROM Credits WHERE PartnerId=$p AND AvailableAmount>0 ORDER BY DocumentDate,Id":$"SELECT Id,AvailableAmount FROM Credits WHERE PartnerId=$p AND AvailableAmount>0 AND Id IN ({string.Join(',',ids.Select((_,i)=>"$c"+i))}) ORDER BY DocumentDate,Id";cmd.Parameters.AddWithValue("$p",partnerId.ToString());if(ids is not null)for(var i=0;i<ids.Length;i++)cmd.Parameters.AddWithValue("$c"+i,ids[i].ToString());using var r=cmd.ExecuteReader();while(r.Read())credits.Add((Guid.Parse(r.GetString(0)),r.GetDecimal(1)));}
            if(ids is not null&&credits.Count!=ids.Length)throw new InvalidOperationException("Uno de los créditos seleccionados ya no está disponible."); var invoiceTotal=invoiceRows.Sum(x=>x.Pending);var creditTotal=credits.Sum(x=>x.Available);if(creditTotal<invoiceTotal)throw new InvalidOperationException("El saldo a favor no es suficiente para cubrir las facturas seleccionadas.");
            var compensationId=Guid.NewGuid();var now=DateTime.UtcNow;var remainingCredit=creditTotal;var remainingByCredit=credits.ToDictionary(x=>x.Id,x=>x.Available);var allocations=new List<CompensationInvoiceExecution>();
            foreach(var invoice in invoiceRows){var remaining=invoice.Pending;foreach(var credit in credits){if(remaining<=0)break;var available=remainingByCredit[credit.Id];var amount=Math.Min(remaining,Math.Min(available,remainingCredit));if(amount<=0)continue;using(var update=c.CreateCommand()){update.Transaction=tx;update.CommandText="UPDATE Credits SET AvailableAmount=AvailableAmount-$a WHERE Id=$i AND AvailableAmount>=$a";update.Parameters.AddWithValue("$a",amount);update.Parameters.AddWithValue("$i",credit.Id.ToString());if(update.ExecuteNonQuery()!=1)throw new InvalidOperationException("El saldo cambió mientras se procesaba la compensación.");}using(var app=c.CreateCommand()){app.Transaction=tx;app.CommandText="INSERT INTO CreditApplications VALUES($id,$c,$i,$p,$a,$d,$u)";app.Parameters.AddWithValue("$id",Guid.NewGuid().ToString());app.Parameters.AddWithValue("$c",credit.Id.ToString());app.Parameters.AddWithValue("$i",invoice.Id.ToString());app.Parameters.AddWithValue("$p",partnerId.ToString());app.Parameters.AddWithValue("$a",amount);app.Parameters.AddWithValue("$d",now.ToString("O"));app.Parameters.AddWithValue("$u",appliedBy.ToString());app.ExecuteNonQuery();}remaining-=amount;remainingCredit-=amount;remainingByCredit[credit.Id]-=amount;}if(remaining>0)throw new InvalidOperationException("El saldo a favor no es suficiente para cubrir las facturas seleccionadas.");using(var update=c.CreateCommand()){update.Transaction=tx;update.CommandText="UPDATE Invoices SET PendingAmount=0,Status='COMPENSATED' WHERE Id=$i AND PartnerId=$p AND PendingAmount>0";update.Parameters.AddWithValue("$i",invoice.Id.ToString());update.Parameters.AddWithValue("$p",partnerId.ToString());if(update.ExecuteNonQuery()!=1)throw new InvalidOperationException("La factura cambió mientras se procesaba la compensación.");}using(var link=c.CreateCommand()){link.Transaction=tx;link.CommandText="INSERT INTO CompensationInvoices VALUES($id,$c,$i,$before,$applied,0)";link.Parameters.AddWithValue("$id",Guid.NewGuid().ToString());link.Parameters.AddWithValue("$c",compensationId.ToString());link.Parameters.AddWithValue("$i",invoice.Id.ToString());link.Parameters.AddWithValue("$before",invoice.Pending);link.Parameters.AddWithValue("$applied",invoice.Pending);link.ExecuteNonQuery();}allocations.Add(new(invoice.Id.ToString(),invoice.Pending,0,"COMPENSATED"));}
            var resulting=ScalarDecimal(c,tx,"SELECT COALESCE(SUM(AvailableAmount),0) FROM Credits WHERE PartnerId=$p AND AvailableAmount>0",("$p",partnerId.ToString()));var totalDebtAfter=ScalarDecimal(c,tx,"SELECT COALESCE(SUM(PendingAmount),0) FROM Invoices WHERE PartnerId=$p AND PendingAmount>0 AND Status NOT IN ('PAID','CANCELLED','COMPENSATED')",("$p",partnerId.ToString()));var overdueAfter=ScalarDecimal(c,tx,"SELECT COALESCE(SUM(PendingAmount),0) FROM Invoices WHERE PartnerId=$p AND PendingAmount>0 AND Status NOT IN ('PAID','CANCELLED','COMPENSATED') AND date(DueDate)<date('now')",("$p",partnerId.ToString()));var response=new CompensationExecutionResponse(compensationId.ToString(),previous,invoiceTotal,resulting,totalDebtAfter,overdueAfter,allocations,creditTotal-invoiceTotal);
            using(var insert=c.CreateCommand()){insert.Transaction=tx;insert.CommandText="INSERT INTO Compensations VALUES($id,$p,$before,$amount,$after,'COMPLETED',$u,$date,$obs,$key,$json)";insert.Parameters.AddWithValue("$id",compensationId.ToString());insert.Parameters.AddWithValue("$p",partnerId.ToString());insert.Parameters.AddWithValue("$before",previous);insert.Parameters.AddWithValue("$amount",invoiceTotal);insert.Parameters.AddWithValue("$after",resulting);insert.Parameters.AddWithValue("$u",appliedBy.ToString());insert.Parameters.AddWithValue("$date",now.ToString("O"));insert.Parameters.AddWithValue("$obs",observation??"Compensación de facturas con saldo a favor");insert.Parameters.AddWithValue("$key",idempotencyKey);insert.Parameters.AddWithValue("$json",JsonSerializer.Serialize(response));insert.ExecuteNonQuery();}using(var movement=c.CreateCommand()){movement.Transaction=tx;movement.CommandText="INSERT INTO CreditBalanceMovements VALUES($id,$p,'COMPENSATION',$amount,$before,$after,'COMPENSATION',$ref,$u,$date)";movement.Parameters.AddWithValue("$id",Guid.NewGuid().ToString());movement.Parameters.AddWithValue("$p",partnerId.ToString());movement.Parameters.AddWithValue("$amount",-invoiceTotal);movement.Parameters.AddWithValue("$before",previous);movement.Parameters.AddWithValue("$after",resulting);movement.Parameters.AddWithValue("$ref",compensationId.ToString());movement.Parameters.AddWithValue("$u",appliedBy.ToString());movement.Parameters.AddWithValue("$date",now.ToString("O"));movement.ExecuteNonQuery();}tx.Commit();return response;
        }
    }
    public CompensationExecutionResponse Execute(Guid partnerId, Guid appliedBy, Guid invoiceId, IReadOnlyCollection<Guid> creditIds)
        => Execute(partnerId, appliedBy, new[] { invoiceId }, creditIds, null, Guid.NewGuid().ToString("N"));

    public IReadOnlyList<CompensationHistoryResponse> History(Guid partnerId)
    {
        lock (sync)
        {
            using var c = Open(); var result = new List<CompensationHistoryResponse>();
            using var cmd = c.CreateCommand(); cmd.CommandText = "SELECT Id,PreviousCreditBalance,AppliedAmount,ResultingCreditBalance,Status,CreatedAt,Observation FROM Compensations WHERE PartnerId=$p ORDER BY CreatedAt DESC"; cmd.Parameters.AddWithValue("$p", partnerId.ToString());
            using var reader = cmd.ExecuteReader(); while (reader.Read()) result.Add(new(reader.GetString(0), reader.GetDecimal(1), reader.GetDecimal(2), reader.GetDecimal(3), reader.GetString(4), DateTime.Parse(reader.GetString(5)), reader.GetString(6)));
            return result;
        }
    }
    private static decimal ScalarDecimal(SqliteConnection c,SqliteTransaction tx,string sql,params(string Name,object Value)[] parameters){using var cmd=c.CreateCommand();cmd.Transaction=tx;cmd.CommandText=sql;foreach(var p in parameters)cmd.Parameters.AddWithValue(p.Name,p.Value);return Convert.ToDecimal(cmd.ExecuteScalar()??0m);}
}
