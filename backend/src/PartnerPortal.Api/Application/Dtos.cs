namespace PartnerPortal.Api.Application;
public sealed record LoginRequest(string? Ruc, string? Password, string? CaptchaId, string? CaptchaAnswer, bool RememberMe);
public sealed record PartnerResponse(string Id, string Ruc, string BusinessName);
