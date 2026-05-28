const { test, expect } = require('@playwright/test');

  timeout: 300000,
test.use({
  viewport: {
    width: 1920,
    height: 1080
  },
   launchOptions: {
      slowMo: 2000
    }
});


test('cadastro e login', async ({ page }) => {

  // CADASTRO
  await page.goto('http://127.0.0.1:5500/Index/home.html');


  //await page.waitForTimeout(1000);

  //await page.fill('#email', 'fernando@gmail.com');
  //await page.fill('#senha', '33747467');

  await page.click('text=Cadastrar');

  //await page.waitForTimeout(1000);

  // LOGIN
  //await page.goto('http://127.0.0.1:5500/Index/home.html');

  await page.fill('#email', 'fernando@gmail.com');
  await page.fill('#senha', '33747467');

 //await page.waitForTimeout(1000);
 await page.click('text=Entrar');

 //await page.waitForTimeout(1000);

  // VALIDA LOGIN
 // await page.waitForURL(/.*planejamento.*/);

 // await expect(page).toHaveURL(/.*planejamento.*/);
 

});


test('deve abrir questionário pelo checkbox e responder', async ({ page }) => {

  await page.goto('http://127.0.0.1:5500/Index/planejamento.html');

  await page.waitForTimeout(3000);

  // marca a primeira tarefa como concluída
  await page.locator('input[type="checkbox"]').first().click();

  // espera ir para questionário
  await page.waitForURL(/.*questionario.*id=.*/);

  // espera a pergunta carregar
  await page.waitForSelector('input[name="alternativa"]', {
    timeout: 60000
  });

  // escolhe a primeira alternativa
  await page.locator('input[name="alternativa"]').first().click();

  await page.waitForTimeout(1000);

  // clica em responder
  await page.click('text=Responder');

  // valida se apareceu resultado
  await expect(page.locator('#resultado')).not.toBeEmpty();

  //await page.waitForTimeout(3000);

});



test('deve abrir PDF', async ({ page, context }) => {

  
  await page.goto('http://127.0.0.1:5500/Index/planejamento.html');



  // espera planejamento
  await page.waitForURL(/.*planejamento.*/);

  //await page.waitForTimeout(3000);

  // espera nova aba do PDF
  const [novaPagina] = await Promise.all([

    context.waitForEvent('page'),

    page.click('text=Abrir PDF')

  ]);

  // espera carregar
  await novaPagina.waitForLoadState();

  // valida URL pdf
  expect(novaPagina.url()).toContain('/uploads/');

});



test.skip('deve abrir página de tarefa', async ({ page }) => {

  await page.goto('http://127.0.0.1:5500/Index/planejamento.html');

  //await page.waitForTimeout(2000);

  // clica botão
  await page.click('text=Adicionar Tarefa');

  // valida redirecionamento
  await expect(page).toHaveURL(/.*tarefa.*/);
  await browser.close();

});


test('deve abrir progresso e voltar ao menu', async ({ page }) => {

  // começa no planejamento
  await page.goto('http://127.0.0.1:5500/Index/planejamento.html');

  // clica em Ver Progresso
  await page.click('text=Ver Progresso');

  // confirma que abriu progresso
  await page.waitForURL(/.*progresso.*/);

  //await page.waitForTimeout(2000);

  // clica em Voltar para o Menu
  await page.click('text=Voltar para o Menu');

  // confirma que voltou
  await page.waitForURL(/.*planejamento.*/);

});


//.only

test.only('deve abrir simulado e testar botões', async ({ page }) => {

  await page.goto('http://127.0.0.1:5500/Index/planejamento.html');

  await page.waitForTimeout(2000);

  await page.click('text=Fazer Simulado');

  await page.waitForURL(/.*simulado.*/);

  await page.waitForTimeout(5000);

  await expect(page.locator('.titulo-simulado'))
    .toContainText('SIMULADO');

  page.on('dialog', async dialog => {
    console.log(dialog.message());
    await dialog.accept();
  });

  const textoPergunta = await page.locator('#textoPergunta').textContent();

  if (
    textoPergunta.includes('Limite') ||
    textoPergunta.includes('Erro') ||
    textoPergunta.includes('Nenhuma pergunta')
  ) {
    await page.click('text=Finalizar');

    await page.waitForURL(/.*planejamento.*/);

    return;
  }

  await page.waitForSelector('input[name="resposta"]', {
    timeout: 60000
  });

  await page.locator('input[name="resposta"]').first().click();

  await page.waitForTimeout(2000);

  await page.click('text=Próxima Pergunta');

  await page.waitForTimeout(2000);

  await page.locator('input[name="resposta"]').first().click();

  await page.waitForTimeout(2000);

  await page.click('text=Anterior');

  await page.waitForTimeout(2000);

  await page.click('text=Finalizar');

  await page.waitForURL(/.*planejamento.*/);

});