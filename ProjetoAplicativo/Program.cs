//FILE: Program.cs
using Microsoft.EntityFrameworkCore;
using ProjetoAplicativo.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();



//pomelo
var conexaoRoteiro = builder.Configuration.GetConnectionString("ConexaoRoteiro4"); var versaoRoteiro = new MySqlServerVersion(ServerVersion.AutoDetect(conexaoRoteiro));
builder.Services.AddDbContext<ModeloEntidades>(options => options.UseMySql(conexaoRoteiro, versaoRoteiro));

builder.Services.AddCors(options => {
    options.AddPolicy("ReactLocalhost",
        policy => policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                       .AllowAnyMethod()
                       .AllowAnyHeader()
                       .AllowCredentials());
});



var app = builder.Build();
if (!app.Environment.IsDevelopment()) { app.UseExceptionHandler("/Home/Error"); app.UseHsts(); }
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();



//    AddCors() must be called before builder.Build()
//    UseCors() must be called after UseRouting() (if present) but before UseAuthorization()

// cors
app.UseCors("ReactLocalhost");
app.MapGet("/test-cors", () => "CORS is working!").RequireCors("ReactLocalhost");

//seeder
using (var scope = app.Services.CreateScope()) { var services = scope.ServiceProvider; DatabaseSeeder.Initialize(services); }



app.UseAuthorization();
app.MapControllerRoute(name: "default", pattern: "{controller=Home}/{action=Index}/{id?}");
app.Run();
