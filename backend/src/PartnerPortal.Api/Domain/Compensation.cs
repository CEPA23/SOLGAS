namespace PartnerPortal.Api.Domain;

public sealed record Invoice(Guid Id, Guid PartnerId, string Reference, DateTime IssueDate, DateTime DueDate, decimal TotalAmount, decimal PendingAmount, string Status);
public sealed record Credit(Guid Id, Guid PartnerId, string Reference, string DocumentType, DateTime DocumentDate, decimal OriginalAmount, decimal AvailableAmount);
public sealed record CreditApplication(Guid Id, Guid CreditId, Guid InvoiceId, Guid PartnerId, decimal Amount, DateTime AppliedAt, Guid AppliedBy);
public sealed record Compensation(Guid Id, Guid PartnerId, decimal PreviousCreditBalance, decimal AppliedAmount, decimal ResultingCreditBalance, string Status, Guid CreatedBy, DateTime CreatedAt, string Observation, string IdempotencyKey);
public sealed record CompensationInvoice(Guid Id, Guid CompensationId, Guid InvoiceId, decimal PreviousPendingAmount, decimal AppliedAmount, decimal ResultingPendingAmount);
public sealed record CreditBalanceMovement(Guid Id, Guid PartnerId, string MovementType, decimal Amount, decimal PreviousBalance, decimal ResultingBalance, string ReferenceType, Guid ReferenceId, Guid CreatedBy, DateTime CreatedAt);
