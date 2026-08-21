FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/src/PartnerPortal.Api/PartnerPortal.Api.csproj backend/src/PartnerPortal.Api/
RUN dotnet restore backend/src/PartnerPortal.Api/PartnerPortal.Api.csproj
COPY backend/src/PartnerPortal.Api/ backend/src/PartnerPortal.Api/
RUN dotnet publish backend/src/PartnerPortal.Api/PartnerPortal.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
EXPOSE 8080
ENTRYPOINT ["dotnet", "PartnerPortal.Api.dll"]
