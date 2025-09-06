import request from "supertest";
import path from "path";
import { fileURLToPath } from "url";
import app from "./index.js"; // Importa sua aplicação Express

// Obter o caminho do diretório atual em projetos ES Modules (a forma correta)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("API de Geração de Texto", () => {
  // Teste para um prompt de texto simples
  test("POST /api/gerar-texto - deve retornar um texto gerado para um prompt", async () => {
    const response = await request(app)
      .post("/api/gerar-texto")
      .field("prompt", "Olá, mundo!")
      .field("history", "[]");

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/plain/);
    expect(response.text).toBeDefined();
    expect(response.text.length).toBeGreaterThan(0);
  });

  // Teste para um prompt com imagem
  test("POST /api/gerar-texto - deve processar um prompt com imagem", async () => {
    // Caminho para a imagem de teste dedicada na pasta de fixtures
    const imagePath = path.resolve(
      __dirname,
      "__tests__",
      "fixtures",
      "test-image.png"
    );

    const response = await request(app)
      .post("/api/gerar-texto")
      .field("prompt", "O que você vê nesta imagem?")
      .field("history", "[]")
      .attach("image", imagePath);

    expect(response.statusCode).toBe(200);
    expect(response.text.length).toBeGreaterThan(0);
  });
});
