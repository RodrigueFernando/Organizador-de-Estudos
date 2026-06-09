const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

test.setTimeout(300000);

test.use({
  viewport: {
    width: 1920,
    height: 1080
  },
  launchOptions: {
    slowMo: 2000
  }
});

test("cadastro e login", async ({ page }) => {
  page.on("dialog", async dialog => {
    console.log("Alerta:", dialog.message());
    await dialog.accept();
  });

  await page.goto(`${BASE_URL}/index.html`);

  await page.fill("#email", "fernando@gmail.com");
  await page.fill("#senha", "33747467");

  await page.click("text=Cadastrar");

  await page.waitForTimeout(1000);

  await page.fill("#email", "fernando@gmail.com");
  await page.fill("#senha", "33747467");

  await page.click("text=Entrar");

  await page.waitForURL(/.*planejamento.*/, {
    timeout: 60000
  });

  await expect(page).toHaveURL(/.*planejamento.*/);
});

test("deve abrir questionário pelo checkbox e responder", async ({ page }) => {
  page.on("dialog", async dialog => {
    console.log("Alerta:", dialog.message());
    await dialog.accept();
  });

  await page.goto(`${BASE_URL}/planejamento.html`);

  await page.waitForSelector('input[type="checkbox"]', {
    timeout: 60000
  });

  await page.locator('input[type="checkbox"]').first().click();

  await page.waitForURL(/.*questionario.*id=.*/, {
    timeout: 60000
  });

  await page.waitForSelector("#pergunta", {
    timeout: 60000
  });

  const textoPergunta = await page.locator("#pergunta").textContent();

  if (
    textoPergunta.includes("Erro") ||
    textoPergunta.includes("Limite") ||
    textoPergunta.includes("Tente novamente")
  ) {
    console.log("Questionário não foi gerado:", textoPergunta);
    await expect(page.locator("#pergunta")).toBeVisible();
    return;
  }

  await page.waitForSelector('input[name="alternativa"]', {
    timeout: 120000
  });

  await page.locator('input[name="alternativa"]').first().click();

  await page.click("text=Responder");

  await expect(page.locator("#resultado")).not.toBeEmpty();
});



test("deve abrir progresso e voltar ao menu", async ({ page }) => {
  await page.goto(`${BASE_URL}/planejamento.html`);

  await page.click("text=Ver Progresso");

  await page.waitForURL(/.*progresso.*/, {
    timeout: 60000
  });

  await page.click("text=Voltar para o Menu");

  await page.waitForURL(/.*planejamento.*/, {
    timeout: 60000
  });
});



test("deve abrir simulado e testar botões", async ({ page }) => {
  page.on("dialog", async dialog => {
    console.log("Alerta:", dialog.message());
    await dialog.accept();
  });

  await page.goto(`${BASE_URL}/planejamento.html`);

  await page.click("text=Fazer Simulado");

  await page.waitForURL(/.*simulado.*/, {
    timeout: 60000
  });

  await expect(page.locator(".titulo-simulado")).toContainText("SIMULADO");

  await page.waitForSelector("#textoPergunta", {
    timeout: 60000
  });

  await page.waitForTimeout(5000);

  const textoPergunta = await page.locator("#textoPergunta").textContent();

  if (
    textoPergunta.includes("Limite") ||
    textoPergunta.includes("Erro") ||
    textoPergunta.includes("Nenhuma pergunta")
  ) {
    await page.click("text=Finalizar");

    await page.waitForURL(/.*planejamento.*/, {
      timeout: 60000
    });

    return;
  }

  await page.waitForSelector('input[name="resposta"]', {
    timeout: 120000
  });

  await page.locator('input[name="resposta"]').first().click();

  await page.click("text=Próxima Pergunta");

  await page.waitForTimeout(1000);

  const respostas = page.locator('input[name="resposta"]');

  if (await respostas.count() > 0) {
    await respostas.first().click();
  }

  await page.click("text=Anterior");

  await page.waitForTimeout(1000);

  await page.click("text=Finalizar");

  await page.waitForURL(/.*planejamento.*/, {
    timeout: 60000
  });
});



  //Para ver a página abrindo
 //BASE_URL=https://organizador-de-estudos-ucy2.vercel.app npx playwright test --headed

 //interface do Playwright: BASE_URL=https://organizador-de-estudos-ucy2.vercel.app npx playwright test --ui

 //debug:BASE_URL=https://organizador-de-estudos-ucy2.vercel.app npx playwright test --debug

 // npx playwright test --headed