using System;
using PartnerPortal.Api.Infrastructure;
using Xunit;
namespace PartnerPortal.Api.Tests;
public sealed class AuthSecurityTests {
    [Fact] public void Captcha_is_single_use() { var store=new InMemoryCaptchaStore(); store.Put("id","61893",DateTime.UtcNow.AddMinutes(5)); Assert.True(store.Consume("id","61893")); Assert.False(store.Consume("id","61893")); }
    [Fact] public void Expired_captcha_is_rejected() { var store=new InMemoryCaptchaStore(); store.Put("id","61893",DateTime.UtcNow.AddSeconds(-1)); Assert.False(store.Consume("id","61893")); }
    [Fact] public void Incorrect_captcha_answer_is_rejected() { var store=new InMemoryCaptchaStore(); store.Put("id","61893",DateTime.UtcNow.AddMinutes(5)); Assert.False(store.Consume("id","12345")); Assert.False(store.Consume("id","61893")); }
    [Fact] public void Rate_limiter_blocks_after_five_failures() { var limiter=new LoginRateLimiter(); Assert.True(limiter.Allowed("ip:ruc")); for(var i=0;i<5;i++) limiter.Failed("ip:ruc"); Assert.False(limiter.Allowed("ip:ruc")); }
}
