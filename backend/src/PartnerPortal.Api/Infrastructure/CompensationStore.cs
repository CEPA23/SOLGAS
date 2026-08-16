using Microsoft.Data.Sqlite;
using PartnerPortal.Api.Application;
using PartnerPortal.Api.Domain;

namespace PartnerPortal.Api.Infrastructure;

public sealed class CompensationStore
{
    private readonly string connectionString;
    private readonly object sync = new();

    public CompensationStore(IConfiguration configuration) : this(configuration["Compensation:DatabasePath"] ?? Path.Combine(AppContext.BaseDirectory, "data", "compensation.db")) { }

    public CompensationStore(string path)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        connectionString = path == ":memory:" ? "Data Source=:memory:;Pooling=False" : $"Data Source={path};Pooling=False";
        using var connection = Open();
        EnsureSchema(connection);
    }

    private SqliteConnection Open() { var c = new SqliteConnection(connectionString); c.Open(); return c; }
    private static void EnsureSchema(SqliteConnection c)
    {
        using var cmd = c.CreateCommand();
        cmd.CommandText = """
        CREATE TABLE IF NOT EXISTS Invoices(Id TEXT PRIMARY KEY, PartnerId TEXT NOT NULL, Reference TEXT NOT NULL, TotalAmount NUMERIC NOT NULL, PendingAmount NUMERIC NOT NULL);
        CREATE TABLE IF NOT EXISTS Credits(Id TEXT PRIMARY KEY, PartnerId TEXT NOT NULL, Reference TEXT NOT NULL, DocumentType TEXT NOT NULL, DocumentDate TEXT NOT NULL, OriginalAmount NUMERIC NOT NULL, AvailableAmount NUMERIC NOT NULL);
        CREATE TABLE IF NOT EXISTS CreditApplications(Id TEXT PRIMARY KEY, CreditId TEXT NOT NULL, InvoiceId TEXT NOT NULL, PartnerId TEXT NOT NULL, Amount NUMERIC NOT NULL, AppliedAt TEXT NOT NULL, AppliedBy TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS IX_Credits_Partner ON Credits(PartnerId);
        CREATE INDEX IF NOT EXISTS IX_Applications_Credit ON CreditApplications(CreditId);
        """;
        cmd.ExecuteNonQuery();
    }

    public void SeedDemoData(Guid partnerId)
    {
        lock (sync)
        {
            using var c = Open();
            using var tx = c.BeginTransaction();
            using var exists = c.CreateCommand(); exists.Transaction = tx; exists.CommandText = "SELECT COUNT(*) FROM Credits WHERE PartnerId=$p"; exists.Parameters.AddWithValue("$p", partnerId.ToString());
            if (Convert.ToInt32(exists.ExecuteScalar()) == 0)
            {
                InsertInvoice(c, tx, partnerId, "01-F326-00085995", 17666.40m);
                InsertCredit(c, tx, partnerId, "Sin ref.", "Saldo a favor", new DateTime(2026, 8, 11), 314262.58m);
                InsertCredit(c, tx, partnerId, "SALDO-A-FAVOR", "Depósito bancario", new DateTime(2026, 8, 13), 30000m);
                InsertCredit(c, tx, partnerId, "SALDO-A-FAVOR", "Depósito bancario", new DateTime(2026, 8, 13), 30000m);
            }
            tx.Commit();
        }
    }

    private static void InsertInvoice(SqliteConnection c, SqliteTransaction tx, Guid partnerId, string reference, decimal amount) { using var cmd = c.CreateCommand(); cmd.Transaction = tx; cmd.CommandText = "INSERT INTO Invoices VALUES($id,$p,$r,$t,$t)"; cmd.Parameters.AddWithValue("$id", Guid.NewGuid().ToString()); cmd.Parameters.AddWithValue("$p", partnerId.ToString()); cmd.Parameters.AddWithValue("$r", reference); cmd.Parameters.AddWithValue("$t", amount); cmd.ExecuteNonQuery(); }
    private static void InsertCredit(SqliteConnection c, SqliteTransaction tx, Guid partnerId, string reference, string type, DateTime date, decimal amount) { using var cmd = c.CreateCommand(); cmd.Transaction = tx; cmd.CommandText = "INSERT INTO Credits VALUES($id,$p,$r,$t,$d,$o,$o)"; cmd.Parameters.AddWithValue("$id", Guid.NewGuid().ToString()); cmd.Parameters.AddWithValue("$p", partnerId.ToString()); cmd.Parameters.AddWithValue("$r", reference); cmd.Parameters.AddWithValue("$t", type); cmd.Parameters.AddWithValue("$d", date.ToString("O")); cmd.Parameters.AddWithValue("$o", amount); cmd.ExecuteNonQuery(); }

    public CompensationResponse Get(Guid partnerId)
    {
        lock (sync)
        {
            using var c = Open();
            var invoices = new List<CompensationInvoiceResponse>(); using (var cmd = c.CreateCommand()) { cmd.CommandText = "SELECT Id,Reference,TotalAmount,PendingAmount FROM Invoices WHERE PartnerId=$p AND PendingAmount>0"; cmd.Parameters.AddWithValue("$p", partnerId.ToString()); using var r=cmd.ExecuteReader(); while(r.Read()) invoices.Add(new(r.GetString(0),r.GetString(1),r.GetDecimal(2),r.GetDecimal(3))); }
            var credits = new List<CompensationCreditResponse>(); using (var cmd = c.CreateCommand()) { cmd.CommandText = "SELECT Id,Reference,DocumentType,DocumentDate,OriginalAmount,AvailableAmount FROM Credits WHERE PartnerId=$p AND AvailableAmount>0 ORDER BY DocumentDate,Id"; cmd.Parameters.AddWithValue("$p", partnerId.ToString()); using var r=cmd.ExecuteReader(); while(r.Read()) credits.Add(new(r.GetString(0),r.GetString(1),r.GetString(2),DateTime.Parse(r.GetString(3)),r.GetDecimal(4),r.GetDecimal(5))); }
            return new(credits.Sum(x=>x.AvailableAmount), 0, 0, invoices, credits);
        }
    }

    public CompensationExecutionResponse Execute(Guid partnerId, Guid appliedBy, Guid invoiceId, IReadOnlyCollection<Guid> creditIds)
    {
        if (creditIds.Count == 0) throw new InvalidOperationException("Debe seleccionar al menos un crédito.");
        lock (sync)
        {
            using var c = Open(); using var tx = c.BeginTransaction();
            decimal invoicePending; using (var cmd=c.CreateCommand()) { cmd.Transaction=tx; cmd.CommandText="SELECT PendingAmount FROM Invoices WHERE Id=$i AND PartnerId=$p"; cmd.Parameters.AddWithValue("$i",invoiceId.ToString()); cmd.Parameters.AddWithValue("$p",partnerId.ToString()); invoicePending=Convert.ToDecimal(cmd.ExecuteScalar() ?? throw new InvalidOperationException("La factura no existe.")); }
            var credits = new List<(Guid Id, decimal Available)>(); foreach(var id in creditIds.Distinct()) using(var cmd=c.CreateCommand()) { cmd.Transaction=tx; cmd.CommandText="SELECT AvailableAmount FROM Credits WHERE Id=$i AND PartnerId=$p"; cmd.Parameters.AddWithValue("$i",id.ToString()); cmd.Parameters.AddWithValue("$p",partnerId.ToString()); var value=cmd.ExecuteScalar(); if(value is null) throw new InvalidOperationException("Uno de los créditos no existe."); credits.Add((id,Convert.ToDecimal(value))); }
            if (invoicePending <= 0) throw new InvalidOperationException("La factura ya está compensada.");
            var selected=credits.Sum(x=>x.Available); if (selected <= 0) throw new InvalidOperationException("Los créditos seleccionados ya no tienen saldo disponible."); var applied=Math.Min(invoicePending,selected); var remainingToApply=applied;
            foreach(var credit in credits) { var amount=Math.Min(credit.Available,remainingToApply); if(amount<=0) continue; using(var update=c.CreateCommand()) { update.Transaction=tx; update.CommandText="UPDATE Credits SET AvailableAmount=AvailableAmount-$a WHERE Id=$i AND AvailableAmount>=$a"; update.Parameters.AddWithValue("$a",amount); update.Parameters.AddWithValue("$i",credit.Id.ToString()); if(update.ExecuteNonQuery()!=1) throw new InvalidOperationException("El crédito cambió mientras se procesaba la compensación."); } using(var insert=c.CreateCommand()) { insert.Transaction=tx; insert.CommandText="INSERT INTO CreditApplications VALUES($id,$c,$i,$p,$a,$d,$u)"; insert.Parameters.AddWithValue("$id",Guid.NewGuid().ToString()); insert.Parameters.AddWithValue("$c",credit.Id.ToString()); insert.Parameters.AddWithValue("$i",invoiceId.ToString()); insert.Parameters.AddWithValue("$p",partnerId.ToString()); insert.Parameters.AddWithValue("$a",amount); insert.Parameters.AddWithValue("$d",DateTime.UtcNow.ToString("O")); insert.Parameters.AddWithValue("$u",appliedBy.ToString()); insert.ExecuteNonQuery(); } remainingToApply-=amount; }
            using(var update=c.CreateCommand()) { update.Transaction=tx; update.CommandText="UPDATE Invoices SET PendingAmount=PendingAmount-$a WHERE Id=$i AND PendingAmount>=$a"; update.Parameters.AddWithValue("$a",applied); update.Parameters.AddWithValue("$i",invoiceId.ToString()); if(update.ExecuteNonQuery()!=1) throw new InvalidOperationException("La factura cambió mientras se procesaba la compensación."); }
            tx.Commit(); return new(Guid.NewGuid().ToString(),invoiceId.ToString(),invoicePending,applied,invoicePending-applied,selected-applied);
        }
    }
}
