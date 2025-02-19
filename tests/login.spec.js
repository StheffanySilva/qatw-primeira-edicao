import { test, expect } from '@playwright/test';

import { obterCodigo2FA } from '../support/db';

import { LoginPage } from '../pages/LoginPage';
import { DashPage } from '../pages/DashPage';

import { cleanJobs,getJob } from '../support/redis';


test('Não deve logar sem fornecer CPF', async ({ page }) => {

  const loginPage = new LoginPage(page);

  const usuario = {
    cpf: '',  // CPF vazio
    //senha: '147258'
  };

  await loginPage.acessaPagina();
  
  // Não preenche o CPF e tenta continuar
  await loginPage.informaCpf(usuario.cpf);
  
  // Verifica se o erro esperado é mostrado
  await expect(page.locator('span')).toContainText('CPF inválido. Por favor, verifique.');
});

test('Não deve logar com CPF inválido', async ({ page }) => {
  const loginPage = new LoginPage(page);

  const usuario = {
    cpf: '12345678901',  // CPF inválido
    senha: '147258'
  };

  await loginPage.acessaPagina();
  await loginPage.informaCpf(usuario.cpf);

  // Espera o botão "Continuar" ser visível antes de clicar (garante que o CPF foi inserido)
  const continuarButton = page.locator('button', { name: 'Continuar' });
  await continuarButton.waitFor({ state: 'visible', timeout: 5000 });

  // Clica no botão "Continuar"
  await continuarButton.click();

  // Espera a mensagem de erro de CPF inválido aparecer
  const erroLocator = page.locator('span');
  await erroLocator.waitFor({ state: 'visible', timeout: 5000 });

  // Verifica se a mensagem de erro está presente
  await expect(erroLocator).toHaveText('CPF inválido. Por favor, verifique.');
});


test('Não deve logar quando o código de autenticacão é inválido', async ({ page }) => {
  const loginPage = new LoginPage(page)

  const usuario = {
    cpf: '00000014141',
    senha: '147258'
  }
  
  await loginPage.acessaPagina()
  await loginPage.informaCpf(usuario.cpf)
  await loginPage.informaSenha(usuario.senha)
  await loginPage.informe2FA('123456')

  await expect(page.locator('span')).toContainText('Código inválido. Por favor, tente novamente.');
});

test('Deve acessar a conta do usuário', async ({ page }) => {

  const loginPage = new LoginPage(page)
  const dashPage = new DashPage(page)
  
  const usuario = {
    cpf: '00000014141',
    senha: '147258'
  }
  
  await cleanJobs ()

  await loginPage.acessaPagina()
  await loginPage.informaCpf(usuario.cpf)
  await loginPage.informaSenha(usuario.senha)

  //checkpoint
   await page.getByRole('heading', {name: 'Verificação em duas etapas'})
   .waitFor({timeout: 3000})

  const codigo = await getJob()
  //const codigo = await obterCodigo2FA()

  await loginPage.informe2FA(codigo)

  await expect(await dashPage.obterSaldo()).toHaveText('R$ 5.000,00')
  
});