//ModeloEntidades.cs
using Microsoft.EntityFrameworkCore;
namespace ProjetoAplicativo.Data
{
    public class ModeloEntidades : DbContext
    {
        public ModeloEntidades(DbContextOptions<ModeloEntidades> options) : base(options) { }
        public DbSet<ProjetoAplicativo.Models.Abreviatura> Abreviatura { get; set; } = default!;
        public DbSet<ProjetoAplicativo.Models.Cena> Cena { get; set; } = default!;
        public DbSet<ProjetoAplicativo.Models.Gesto> Gesto { get; set; } = default!;
        public DbSet<ProjetoAplicativo.Models.Instrucao> Instrucao { get; set; } = default!;
        public DbSet<ProjetoAplicativo.Models.InstrucaoPersonagem> InstrucaoPersonagem { get; set; } = default!;
        public DbSet<ProjetoAplicativo.Models.Peca> Peca { get; set; } = default!;
        public DbSet<ProjetoAplicativo.Models.PecaPersonagem> PecaPersonagem { get; set; } = default!;
        public DbSet<ProjetoAplicativo.Models.Personagem> Personagem { get; set; } = default!;
    }
}