# Exclusão de obras

A ação secundária **Excluir obra** fica nos detalhes, em **Dados da obra**, ao lado de **Editar obra**. Os cards mantêm **Ver obra** como ação principal. O acesso à exclusão exige ADMIN ou GESTOR, tanto na apresentação quanto no serviço com escopo; o backend aplica a autorização definitiva.

## Confirmação e integração

O modal identifica a obra, informa exclusão física irreversível, remoção em cascata das alocações e preservação dos funcionários. O foco inicial é Cancelar; Escape cancela e devolve foco ao acionador. Durante a chamada, os controles ficam bloqueados e Escape não fecha o modal. A confirmação explícita é suficiente; não foi adicionada digitação do nome.

O serviço existente envia somente DELETE /api/obras/:id através de ApiClient, com credentials: include e X-CSRF-Token em memória. A trava síncrona do componente e a deduplicação de chamadas pendentes por ID no adaptador impedem requisições repetidas. Não há retry automático nem DELETE separado para alocações ou funcionários.

Somente após sucesso da API o adaptador emite a invalidação existente para obras, funcionários, alocações e auditoria. Home, listagens e vínculos consultam novamente a fonte real. A navegação retorna a /obras com mensagem de sucesso e mantém o estado vazio original. Falhas não removem registros localmente: 403/404/rede aparecem no modal; 401 ativa o fluxo existente de sessão expirada e login.

## Arquivos

- src/components/shared/DeleteRecordButton.tsx: confirmação, acessibilidade, bloqueio, permissão e feedback.
- src/components/works/Works.tsx: mensagem de sucesso após retorno.
- src/data/ApiRecordServices.ts: deduplicação de exclusões por registro.
- reference/api-crud-fixture.mjs: fixture HTTP compartilhada extraída do teste existente.
- reference/verify-api-crud.mjs: usa fixture compartilhada e nova identificação da confirmação.
- reference/verify-work-deletion.mjs: testes específicos.
- package.json: comando test:work-deletion.
- docs/work-deletion.md: este relatório.

## Validação

Passaram TypeScript, build API e testes test:work-deletion, test:api-crud, test:records-api e test:http-auth. A suíte específica cobre ADMIN/GESTOR/FUNCIONARIO, foco/Escape/cancelamento, modal em viewport de 390 px, endpoint/corpo/CSRF, estado pendente sem duplicação, 401/403/404/rede, sucesso, listagens/Home, ausência de alocações após cascata simulada, preservação dos funcionários e estado vazio.

Os testes usam exclusivamente HTTP controlado no navegador, sem exclusão no banco de desenvolvimento. A rota, o controller (204) e a relação Prisma onDelete: Cascade foram conferidos no backend local, sem alterações. Persistência e cascata no PostgreSQL real não foram executadas nesta tarefa. Não houve commit ou push.
## Configuração corrigida em 14/11/2026

A ação existente era condicionada ao modo API. O Vite estava carregando mock/local por padrão, razão pela qual o botão não aparecia e cadastros não chegavam ao PostgreSQL. O padrão agora é api/api; a simulação exige dev:mock. Consulte [diagnóstico de consistência](integration-consistency.md) para evidências reais de leitura e limites da validação. Não foi criada uma segunda exclusão.

## Validação real autorizada

Após a troca de senha obrigatória concluída pelo usuário, uma única obra autorizada foi criada pela interface (POST /api/obras → 201). O mesmo registro foi confirmado no PostgreSQL e no Studio e permaneceu na Home e nos detalhes após recarregar. A ação Excluir obra apareceu na sessão ADMIN real; seu modal foi aberto e cancelado. Nenhum DELETE foi enviado e a obra foi mantida. A exclusão real permanece sem teste e depende de autorização própria.
