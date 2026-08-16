namespace PartnerPortal.Api.Domain;

public sealed record Invoice(Guid Id, Guid PartnerId, string Reference, decimal TotalAmount, decimal PendingAmount);
public sealed record Credit(Guid Id, Guid PartnerId, string Reference, string DocumentType, DateTime DocumentDate, decimal OriginalAmount, decimal AvailableAmount);
public sealed record CreditApplication(Guid Id, Guid CreditId, Guid InvoiceId, Guid PartnerId, decimal Amount, DateTime AppliedAt, Guid AppliedBy);
