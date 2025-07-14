// DatabaseSeeder.cs
using Microsoft.EntityFrameworkCore;
using ProjetoAplicativo.Models;
using System;
using System.Linq;

namespace ProjetoAplicativo.Data
{
    public static class DatabaseSeeder
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new ModeloEntidades(
                serviceProvider.GetRequiredService<DbContextOptions<ModeloEntidades>>()))
            {
                if (context.Peca.Any() || context.Personagem.Any() || context.Cena.Any()) { return; }

                var pecas = new Peca[]
                {
                    new Peca { Nome = "Primeira peça"},
                    new Peca { Nome = "Segunda peça"},
                    new Peca { Nome = "Terceira peça"},
                    new Peca { Nome = "Quarta peça"},
                    new Peca { Nome = "Quinta peça"},
                    new Peca { Nome = "Sexta peça"},
                    new Peca { Nome = "Sétima peça"},
                    new Peca { Nome = "Oitava peça"},
                    new Peca { Nome = "Nona peça"},
                    new Peca { Nome = "Décima peça"}
                };
                context.Peca.AddRange(pecas);
                context.SaveChanges();

                var personagens = new Personagem[]
                {
                    new Personagem { Nome = "Primeiro personagem"},
                    new Personagem { Nome = "Segundo personagem"},
                    new Personagem { Nome = "Terceiro personagem"},
                    new Personagem { Nome = "Quarto personagem"},
                    new Personagem { Nome = "Quinto personagem"},
                    new Personagem { Nome = "Sexto personagem"},
                    new Personagem { Nome = "Sétimo personagem"},
                    new Personagem { Nome = "Oitavo personagem"},
                    new Personagem { Nome = "Nono personagem"},
                    new Personagem { Nome = "Décimo personagem"}
                };
                context.Personagem.AddRange(personagens);
                context.SaveChanges();

                var cenas = new Cena[]
                {
                    new Cena { Nome = "Primeira cena", PecaId = pecas[0].Id },
                    new Cena { Nome = "Segunda cena", PecaId = pecas[1].Id },
                    new Cena { Nome = "Terceira cena", PecaId = pecas[0].Id },
                    new Cena { Nome = "Quarta cena", PecaId = pecas[1].Id },
                    new Cena { Nome = "Quinta cena", PecaId = pecas[0].Id },
                    new Cena { Nome = "Sexta cena", PecaId = pecas[1].Id },
                    new Cena { Nome = "Sétima cena", PecaId = pecas[0].Id },
                    new Cena { Nome = "Oitava cena", PecaId = pecas[1].Id },
                    new Cena { Nome = "Nona cena", PecaId = pecas[0].Id },
                    new Cena { Nome = "Décima cena", PecaId = pecas[1].Id }
                };
                context.Cena.AddRange(cenas);
                context.SaveChanges();

                var pecaPersonagens = new PecaPersonagem[]
                {
                    new PecaPersonagem { PecaId = pecas[0].Id, PersonagemId = personagens[0].Id },
                    new PecaPersonagem { PecaId = pecas[0].Id, PersonagemId = personagens[2].Id },
                    new PecaPersonagem { PecaId = pecas[0].Id, PersonagemId = personagens[4].Id },
                    new PecaPersonagem { PecaId = pecas[0].Id, PersonagemId = personagens[6].Id },
                    new PecaPersonagem { PecaId = pecas[0].Id, PersonagemId = personagens[8].Id },
                    
                    new PecaPersonagem { PecaId = pecas[1].Id, PersonagemId = personagens[1].Id },
                    new PecaPersonagem { PecaId = pecas[1].Id, PersonagemId = personagens[3].Id },
                    new PecaPersonagem { PecaId = pecas[1].Id, PersonagemId = personagens[5].Id },
                    new PecaPersonagem { PecaId = pecas[1].Id, PersonagemId = personagens[7].Id },
                    new PecaPersonagem { PecaId = pecas[1].Id, PersonagemId = personagens[9].Id }
                };
                context.PecaPersonagem.AddRange(pecaPersonagens);
                context.SaveChanges();
            }
        }
    }
}