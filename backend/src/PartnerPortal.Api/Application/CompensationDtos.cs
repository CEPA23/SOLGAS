namespace PartnerPortal.Api.Application;

public sealed record CompensationCreditResponse(string Id, string Reference, string DocumentType, DateTime Date, decimal OriginalAmount, decimal AvailableAmount);
public sealed record CompensationInvoiceResponse(string Id, string Reference, string DocumentType, DateTime IssueDate, DateTime DueDate, decimal TotalAmount, decimal Perception, decimal PendingAmount, string Status, bool IsOverdue);
public sealed record CompensationResponse(decimal TotalAvailableCredit, decimal TotalDebt, decimal OverdueDebt, IReadOnlyList<CompensationInvoiceResponse> Invoices, IReadOnlyList<CompensationCreditResponse> Credits);
public sealed record ExecuteCompensationRequest(IReadOnlyList<string> InvoiceIds, string? Observation, string? IdempotencyKey, IReadOnlyList<string>? CreditIds = null);
public sealed record CompensationInvoiceExecution(string InvoiceId, decimal AppliedAmount, decimal PendingAmount, string Status);
public sealed record CompensationExecutionResponse(string Id, decimal PreviousCreditBalance, decimal AppliedAmount, decimal ResultingCreditBalance, decimal TotalDebt, decimal OverdueDebt, IReadOnlyList<CompensationInvoiceExecution> CompensatedInvoices, decimal UnusedCredit)
{
    public decimal CreditApplied => AppliedAmount;
}
public sealed record CompensationHistoryResponse(string Id, decimal PreviousCreditBalance, decimal AppliedAmount, decimal ResultingCreditBalance, string Status, DateTime CreatedAt, string Observation);
