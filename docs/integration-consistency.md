# Diagnóstico de consistência — 14/11/2026

## Causa comprovada e correção

O Vite ativo em localhost:5173 executava o frontend do projeto. A resposta HTTP de /src/api/config.ts continha MODE=development, VITE_AUTH_MODE=mock e VITE_DATA_MODE=local. A configuração .env.development era a responsável. A .env.api existia, mas não é carregada pelo comando vite sem --mode api.

Nesse modo, createDataServices selecionava MockWorkService (LocalRecordService, chave cleanpro.works), e não ApiWorkService. Por isso, um cadastro nessa aplicação era salvo somente no navegador e não fazia POST /api/obras. A condição VITE_DATA_MODE === api ocultava a exclusão real em WorkDetails. O código descrito no relatório anterior estava presente inclusive na versão servida pelo Vite, mas o modo executado não o disponibilizava. A validação anterior por HTTP controlado não tinha verificado esse padrão de execução.

Corrigido: .env.development e .env.production usam api/api. Desenvolvimento usa localhost:3000 e produ??o usa a mesma origem por padr?o. A simulação ficou em .env.mock e exige npm run dev:mock. npm run dev e dev:api usam localhost:5173 com --strictPort; uma segunda inicialização foi testada e falhou explicitamente, sem trocar para 5174. O Vite anterior foi encerrado e o novo foi iniciado no diretório correto. Os dados locais do navegador foram preservados e não migrados automaticamente para o banco.

Após o reinício, a resposta real servida pelo Vite confirma MODE=development, AUTH=api, DATA=api e API_URL=http://localhost:3000. Acesse essa URL, atualize a página e faça login com uma conta real; a antiga sessão mock não autentica no backend.

## Configuração e precedência

Não foram encontrados .env, .env.local ou .env.development.local no frontend. Antes da correção, somente .env.development, .env.api e .env.example estavam presentes. As variáveis foram conferidas na transformação HTTP do Vite, além da leitura dos arquivos.

Precedência do Vite, da maior para a menor: ambiente do processo, .env.[mode].local, .env.[mode], .env.local, .env. .env.example não é carregado. Reinicie o Vite após mudar modos/configurações. Arquivos locais continuam ignorados; somente arquivos públicos de configuração são versionáveis. Produção usa a mesma origem por padrão. Para uma origem distinta, defina VITE_API_URL durante o build.

## Banco efetivamente consultado

| Item | Evidência |
|---|---|
| Bootstrap do Prisma do backend | src/lib/prisma.ts usa PrismaPg com env.DATABASE_URL; consulta real somente de leitura confirmou banco/schema/servidor abaixo |
| Prisma Studio em execução | consulta SELECT pelo /bff ativo confirmou exatamente o mesmo banco/schema/servidor |
| Relação Prisma | Obra usa @@map("obras"); tabela SQL public.obras |
| Contagem real | 0 obras nas duas consultas |

A comparação não imprimiu DATABASE_URL completa, usuários de banco, senhas, tokens ou cookies. Não houve criação de outro banco/volume, migration, seed, reset ou exclusão. A consulta pelo adaptador usou o mesmo módulo de configuração/Prisma do backend, em processo separado de leitura; não é evidência de uma requisição autenticada de criação no Express.

## Fluxos e navegação conferidos

- Cards de Obras e Home abrem /obras/:id pelo controle Ver obra; a rota existente renderiza WorkDetails.
- ADMIN e GESTOR recebem Excluir obra em Dados da obra, ao lado de Editar obra. FUNCIONARIO não recebe a ação; o serviço com escopo e a API continuam autorizando independentemente.
- O modal identifica a obra, explica a cascata e a preservação dos funcionários. Nenhuma exclusão ocorre antes da confirmação.
- ApiWorkService usa o ApiClient centralizado, credentials: include e X-CSRF-Token em mutações.
- O formulário aguarda create/update antes de mostrar sucesso e navegar. O adaptador envia somente nome, endereço, status e datas compatíveis; o controller POST existente retorna 201.
- Serviços API não usam armazenamento local como fallback. Falhas são erros; coleções só são atualizadas após a resposta da fonte consultada.
- Exclusão confirmada envia somente DELETE /api/obras/:id; sucesso 204 invalida as coleções relacionadas, retorna a /obras e mostra mensagem. Não foi adicionada outra exclusão.
- Nenhum componente ou layout precisou ser redesenhado: a causa era a seleção do modo.

## Validação executada

### Real, sem mocks HTTP e sem mutações de negócio

- GET /health: 200.
- CORS da API: Access-Control-Allow-Origin=http://localhost:5173 e credentials=true.
- GET /api/obras sem sessão: 401, sem exposição de registros.
- Navegador isolado abriu /home, realizou GET /api/auth/me na API real e foi redirecionado a /login, sem erros JavaScript e sem consultas de obras antes de autenticar.
- Configuração efetivamente entregue pelo Vite: api/api, localhost:3000.
- Banco e schema, servidor e contagem de obras comparados pelo Prisma do backend e pelo Studio ativo, somente leitura.
- Segunda inicialização do Vite recusada pela porta fixa já ocupada.

### Automatizada, com distinção de escopo

Passaram TypeScript, build padrão (production/API), build:api e onze verificações:

1. test:integration-config — regressão dos padrões API, modo mock explícito, origem/porta e precedência de ambiente.
2. test:real-readonly — HTTP real e navegador sem interceptação, limitado à configuração, saúde/CORS e proteção sem sessão.
3. test:routes — mock/local isolado.
4. test:data — mock/local isolado.
5. test:flows — mock/local isolado.
6. test:auth — mock/local isolado, autenticação desabilitada e preview de produção com mock bloqueado.
7. test:users — HTTP controlado.
8. test:records-api — HTTP controlado.
9. test:http-auth — HTTP controlado.
10. test:api-crud — HTTP controlado.
11. test:work-deletion — HTTP controlado.

As verificações controladas cobrem POST/PUT/DELETE, payloads, CSRF/cookies, confirmação, permissões, falhas e consistência/recarregamento nas fontes simuladas. Não comprovam persistência real. Não há configuração de lint. A suíte do backend não foi executada contra o banco de desenvolvimento, pois contém operações destrutivas.

## Arquivos desta correção

- .env.development — padrão API.
- .env.production — novo padrão API para build.
- .env.mock — simulação explícita.
- package.json — origem/porta fixa no dev, dev:mock e comandos de regressão/leitura real.
- .gitignore — permite configurações públicas e a fixture compartilhada de testes, mantendo .env privados/locais ignorados.
- reference/verify-integration-config.mjs — nova regressão.
- reference/verify-real-readonly.mjs — nova verificação real não destrutiva.
- README.md — comandos e estado atual da integração; remove impedimento histórico já resolvido.
- docs/work-deletion.md — esclarece a condição de modo da exclusão.
- docs/integration-consistency.md — este diagnóstico.

## Limite e próxima validação

Após autorização explícita para um cadastro único, o login real retornou 200. A conta ADMIN exigiu a troca obrigatória de senha, concluída pessoalmente pelo usuário na janela interativa. O teste prosseguiu na mesma sessão, sem conhecer ou registrar a nova senha no script ou nos relatórios e sem contornar o fluxo da API.

O único cadastro autorizado foi realizado pelo formulário real:
- POST http://localhost:3000/api/obras retornou 201 Created, com cookie de sessão e X-CSRF-Token.
- Apenas nome e status foram enviados, conforme o contrato.
- O frontend mostrou sucesso após a resposta da API e abriu /obras/:id.
- Recarregar os detalhes preservou a obra e a sessão.
- Obras e Home exibiram o registro real; a Home também o preservou após recarregar.
- Ver obra abriu os detalhes correspondentes.
- Excluir obra apareceu para o ADMIN autenticado. O modal foi aberto e cancelado; nenhum DELETE foi enviado.
- GET autenticado /api/obras/1 retornou 200 com o mesmo ID e nome.
- Consultas reais somente de leitura confirmaram o mesmo registro na tabela de obras do PostgreSQL.
- A contagem de obras passou de 0 para 1. Houve exatamente um POST de negócio, nenhuma alteração/exclusão e nenhum erro JavaScript.

Cadastro, consulta, navegação e permanência após recarregar estão comprovados na integração real. A obra foi mantida cadastrada, conforme autorizado.

A exclusão real não foi testada e exige autorização específica; a autorização proposta para cadastro não inclui exclusão. Nenhuma conta, obra, funcionário, alocação ou volume foi apagado.
