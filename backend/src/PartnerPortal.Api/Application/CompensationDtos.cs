namespace PartnerPortal.Api.Application;

public sealed record CompensationCreditResponse(string Id, string Reference, string DocumentType, DateTime Date, decimal OriginalAmount, decimal AvailableAmount);
public sealed record CompensationInvoiceResponse(string Id, string Reference, decimal TotalAmount, decimal PendingAmount);
public sealed record CompensationResponse(decimal TotalAvailableCredit, decimal TotalDebt, decimal OverdueDebt, IReadOnlyList<CompensationInvoiceResponse> Invoices, IReadOnlyList<CompensationCreditResponse> Credits);
public sealed record ExecuteCompensationRequest(string InvoiceId, IReadOnlyList<string> CreditIds);
public sealed record CompensationExecutionResponse(string Id, string InvoiceId, decimal InvoiceAmount, decimal CreditApplied, decimal PendingAmount, decimal UnusedCredit);
