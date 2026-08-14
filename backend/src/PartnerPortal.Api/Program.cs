using System.Security.Cryptography;
using BCrypt.Net;
using Microsoft.AspNetCore.Http.HttpResults;
using PartnerPortal.Api.Application;
using PartnerPortal.Api.Domain;
using PartnerPortal.Api.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<IPartnerRepository, InMemoryPartnerRepository>();
builder.Services.AddSingleton<ICaptchaStore, InMemoryCaptchaStore>();
builder.Services.AddSingleton<CaptchaService>(); builder.Services.AddSingleton<SessionStore>(); builder.Services.AddSingleton<LoginAuditStore>(); builder.Services.AddSingleton<LoginRateLimiter>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
var app = builder.Build(); app.UseCors();
var partners = app.Services.GetRequiredService<IPartnerRepository>();
var seedRuc = Environment.GetEnvironmentVariable("PARTNER_DEMO_RUC") ?? builder.Configuration["PartnerDemo:Ruc"]; var seedPassword = Environment.GetEnvironmentVariable("PARTNER_DEMO_PASSWORD") ?? builder.Configuration["PartnerDemo:Password"];
if (!string.IsNullOrWhiteSpace(seedRuc) && !string.IsNullOrWhiteSpace(seedPassword) && !partners.Exists(seedRuc)) partners.Save(new Partner { Ruc=seedRuc, BusinessName="Distribuidora Demo S.A.C.", PasswordHash=global::BCrypt.Net.BCrypt.HashPassword(seedPassword, workFactor:12) });

app.MapGet("/api/auth/captcha", (CaptchaService captcha) => Results.Ok(captcha.Create()));
app.MapPost("/api/auth/login", (LoginRequest request, HttpContext http, IPartnerRepository repo, CaptchaService captcha, SessionStore sessions, LoginAuditStore audits, LoginRateLimiter limiter) => {
    var ip = http.Connection.RemoteIpAddress?.ToString() ?? "unknown"; var ua = http.Request.Headers.UserAgent.ToString(); var ruc = request.Ruc?.Trim() ?? ""; var key = $"{ip}:{ruc}";
    if (!limiter.Allowed(key)) return Results.Json(new { message="Demasiados intentos. Intente nuevamente más tarde." }, statusCode:429);
    if (!System.Text.RegularExpressions.Regex.IsMatch(ruc, "^\\d{11}$") || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.CaptchaId) || !System.Text.RegularExpressions.Regex.IsMatch(request.CaptchaAnswer ?? "", "^\\d{5}$")) return Results.BadRequest(new { message="Complete los campos requeridos." });
    if (!captcha.Verify(request.CaptchaId!, request.CaptchaAnswer!)) { audits.Add(new(null,ruc,false,ip,ua,DateTime.UtcNow)); limiter.Failed(key); return Results.BadRequest(new { message="El código de verificación es incorrecto." }); }
    var partner = repo.FindByRuc(ruc); if (partner is null || !partner.IsActive || !global::BCrypt.Net.BCrypt.Verify(request.Password!, partner.PasswordHash)) { audits.Add(new(partner?.Id,ruc,false,ip,ua,DateTime.UtcNow)); limiter.Failed(key); return Results.Json(new { message=partner is not null && !partner.IsActive ? "No se puede iniciar sesión con esta cuenta. Comuníquese con el administrador." : "RUC o contraseña incorrectos." }, statusCode:401); }
    partner.LastLoginAt=DateTime.UtcNow; partner.UpdatedAt=DateTime.UtcNow; var access=Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)); var refresh=Convert.ToBase64String(RandomNumberGenerator.GetBytes(48)); var accessDuration=TimeSpan.FromMinutes(20); var refreshDuration=request.RememberMe?TimeSpan.FromDays(30):TimeSpan.FromHours(2); sessions.Add(access,new SessionStore.Session(partner.Id,DateTime.UtcNow.Add(accessDuration),DateTime.UtcNow.Add(refreshDuration),TokenHash(refresh)));
    Cookie(http,"access_token",access,accessDuration); Cookie(http,"refresh_token",refresh,refreshDuration); audits.Add(new(partner.Id,ruc,true,ip,ua,DateTime.UtcNow)); return Results.Ok(new { success=true, partner=new PartnerResponse(partner.Id.ToString(),partner.Ruc,partner.BusinessName) });
});
app.MapPost("/api/auth/refresh", (HttpContext http, SessionStore sessions) => { if(!http.Request.Cookies.TryGetValue("refresh_token",out var refresh) || !sessions.TryGetByRefresh(TokenHash(refresh),out var oldAccess,out var session) || session is null || oldAccess is null) return Results.Unauthorized(); sessions.Remove(oldAccess); var access=Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)); sessions.Add(access,session with { AccessExpires=DateTime.UtcNow.AddMinutes(20) }); Cookie(http,"access_token",access,TimeSpan.FromMinutes(20)); return Results.Ok(new { success=true }); });
app.MapGet("/api/auth/me", (HttpContext http, IPartnerRepository repo, SessionStore sessions) => { if(!http.Request.Cookies.TryGetValue("access_token",out var token) || !sessions.TryGet(token,out var session) || session is null) return Results.Unauthorized(); var partner=repo.FindById(session.PartnerId); return partner is null ? Results.Unauthorized() : Results.Ok(new { partner=new PartnerResponse(partner.Id.ToString(),partner.Ruc,partner.BusinessName) }); });
app.MapPost("/api/auth/logout", (HttpContext http, SessionStore sessions) => { if(http.Request.Cookies.TryGetValue("access_token",out var token)) sessions.Remove(token); http.Response.Cookies.Delete("access_token"); http.Response.Cookies.Delete("refresh_token"); return Results.Ok(new { success=true }); });
app.Run();
static string TokenHash(string value) => Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(value)));
static void Cookie(HttpContext http,string name,string value,TimeSpan age) => http.Response.Cookies.Append(name,value,new CookieOptions { HttpOnly=true, Secure=http.Request.IsHttps, SameSite=SameSiteMode.Lax, MaxAge=age, Path="/" });
static class PartnerRepositoryExtensions { public static bool Exists(this IPartnerRepository repo,string ruc) => repo.FindByRuc(ruc) is not null; public static Partner? FindById(this IPartnerRepository repo,Guid id) => repo is InMemoryPartnerRepository memory ? memory.FindById(id) : null; }
