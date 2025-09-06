# Dockerfile para Railway
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["portalti-backend/PortalTi.Api/PortalTi.Api.csproj", "portalti-backend/PortalTi.Api/"]
RUN dotnet restore "portalti-backend/PortalTi.Api/PortalTi.Api.csproj"
COPY . .
WORKDIR "/src/portalti-backend/PortalTi.Api"
RUN dotnet build "PortalTi.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PortalTi.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "PortalTi.Api.dll"]
