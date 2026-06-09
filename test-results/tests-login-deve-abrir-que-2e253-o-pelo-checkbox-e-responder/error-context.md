# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/login.test.js >> deve abrir questionário pelo checkbox e responder
- Location: tests/login.test.js:44:1

# Error details

```
TimeoutError: page.waitForSelector: Timeout 60000ms exceeded.
Call log:
  - waiting for locator('input[type="checkbox"]') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "PLANEJAMENTO DE ESTUDOS" [level=2] [ref=e4]
  - paragraph [ref=e5]: "Conteúdo do dia:"
  - paragraph [ref=e7]: Nenhuma tarefa cadastrada.
  - generic [ref=e8]:
    - button "Ver Progresso" [ref=e9] [cursor=pointer]
    - button "Adicionar Tarefa" [ref=e10] [cursor=pointer]
    - button "Fazer Simulado" [ref=e11] [cursor=pointer]
```

# Test source

```ts
  1   | const { test, expect } = require("@playwright/test");
  2   | 
  3   | const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
  4   | 
  5   | test.setTimeout(300000);
  6   | 
  7   | test.use({
  8   |   viewport: {
  9   |     width: 1920,
  10  |     height: 1080
  11  |   },
  12  |   launchOptions: {
  13  |     slowMo: 2000
  14  |   }
  15  | });
  16  | 
  17  | test("cadastro e login", async ({ page }) => {
  18  |   page.on("dialog", async dialog => {
  19  |     console.log("Alerta:", dialog.message());
  20  |     await dialog.accept();
  21  |   });
  22  | 
  23  |   await page.goto(`${BASE_URL}/index.html`);
  24  | 
  25  |   await page.fill("#email", "fernando@gmail.com");
  26  |   await page.fill("#senha", "33747467");
  27  | 
  28  |   await page.click("text=Cadastrar");
  29  | 
  30  |   await page.waitForTimeout(1000);
  31  | 
  32  |   await page.fill("#email", "fernando@gmail.com");
  33  |   await page.fill("#senha", "33747467");
  34  | 
  35  |   await page.click("text=Entrar");
  36  | 
  37  |   await page.waitForURL(/.*planejamento.*/, {
  38  |     timeout: 60000
  39  |   });
  40  | 
  41  |   await expect(page).toHaveURL(/.*planejamento.*/);
  42  | });
  43  | 
  44  | test("deve abrir questionário pelo checkbox e responder", async ({ page }) => {
  45  |   page.on("dialog", async dialog => {
  46  |     console.log("Alerta:", dialog.message());
  47  |     await dialog.accept();
  48  |   });
  49  | 
  50  |   await page.goto(`${BASE_URL}/planejamento.html`);
  51  | 
> 52  |   await page.waitForSelector('input[type="checkbox"]', {
      |              ^ TimeoutError: page.waitForSelector: Timeout 60000ms exceeded.
  53  |     timeout: 60000
  54  |   });
  55  | 
  56  |   await page.locator('input[type="checkbox"]').first().click();
  57  | 
  58  |   await page.waitForURL(/.*questionario.*id=.*/, {
  59  |     timeout: 60000
  60  |   });
  61  | 
  62  |   await page.waitForSelector("#pergunta", {
  63  |     timeout: 60000
  64  |   });
  65  | 
  66  |   const textoPergunta = await page.locator("#pergunta").textContent();
  67  | 
  68  |   if (
  69  |     textoPergunta.includes("Erro") ||
  70  |     textoPergunta.includes("Limite") ||
  71  |     textoPergunta.includes("Tente novamente")
  72  |   ) {
  73  |     console.log("Questionário não foi gerado:", textoPergunta);
  74  |     await expect(page.locator("#pergunta")).toBeVisible();
  75  |     return;
  76  |   }
  77  | 
  78  |   await page.waitForSelector('input[name="alternativa"]', {
  79  |     timeout: 120000
  80  |   });
  81  | 
  82  |   await page.locator('input[name="alternativa"]').first().click();
  83  | 
  84  |   await page.click("text=Responder");
  85  | 
  86  |   await expect(page.locator("#resultado")).not.toBeEmpty();
  87  | });
  88  | 
  89  | 
  90  | 
  91  | test("deve abrir progresso e voltar ao menu", async ({ page }) => {
  92  |   await page.goto(`${BASE_URL}/planejamento.html`);
  93  | 
  94  |   await page.click("text=Ver Progresso");
  95  | 
  96  |   await page.waitForURL(/.*progresso.*/, {
  97  |     timeout: 60000
  98  |   });
  99  | 
  100 |   await page.click("text=Voltar para o Menu");
  101 | 
  102 |   await page.waitForURL(/.*planejamento.*/, {
  103 |     timeout: 60000
  104 |   });
  105 | });
  106 | 
  107 | 
  108 | 
  109 | test("deve abrir simulado e testar botões", async ({ page }) => {
  110 |   page.on("dialog", async dialog => {
  111 |     console.log("Alerta:", dialog.message());
  112 |     await dialog.accept();
  113 |   });
  114 | 
  115 |   await page.goto(`${BASE_URL}/planejamento.html`);
  116 | 
  117 |   await page.click("text=Fazer Simulado");
  118 | 
  119 |   await page.waitForURL(/.*simulado.*/, {
  120 |     timeout: 60000
  121 |   });
  122 | 
  123 |   await expect(page.locator(".titulo-simulado")).toContainText("SIMULADO");
  124 | 
  125 |   await page.waitForSelector("#textoPergunta", {
  126 |     timeout: 60000
  127 |   });
  128 | 
  129 |   await page.waitForTimeout(5000);
  130 | 
  131 |   const textoPergunta = await page.locator("#textoPergunta").textContent();
  132 | 
  133 |   if (
  134 |     textoPergunta.includes("Limite") ||
  135 |     textoPergunta.includes("Erro") ||
  136 |     textoPergunta.includes("Nenhuma pergunta")
  137 |   ) {
  138 |     await page.click("text=Finalizar");
  139 | 
  140 |     await page.waitForURL(/.*planejamento.*/, {
  141 |       timeout: 60000
  142 |     });
  143 | 
  144 |     return;
  145 |   }
  146 | 
  147 |   await page.waitForSelector('input[name="resposta"]', {
  148 |     timeout: 120000
  149 |   });
  150 | 
  151 |   await page.locator('input[name="resposta"]').first().click();
  152 | 
```