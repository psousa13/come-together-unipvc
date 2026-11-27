# Come Together: UNIPVC

Aplicação web fechada, só para membros da UniPVC, que junta os eventos e as comunidades do campus num único sítio.

Projeto da unidade curricular SIR 2026/27, Fase 2 (desenvolvimento incremental da aplicação). Grupo PFSIR_G13.

| | |
|---|---|
| Cliente | https://come-together-unipvc-one.vercel.app |
| API | https://come-together-api.onrender.com/api/health |

O plano gratuito do Render adormece após inatividade: o primeiro pedido pode demorar cerca de 1 minuto.

## Problema

Resultados preliminares de um questionário a estudantes (n=13, 12 respostas da ESTG):

1. 77% já soube de um evento só depois de ele acontecer.
2. 62% raramente ou nunca sabe de eventos de outras escolas.
3. Os eventos estão espalhados por email institucional, Instagram, grupos de WhatsApp e cartazes.

A UniPVC tem 6 escolas em 4 concelhos.

## Solução

Princípio de produto: descoberta primeiro (mapa, filtros, avisos), parte social depois.

1. Mapa de eventos por campus (100% dos inquiridos acha-o útil).
2. Lista de eventos com filtros e «Eu vou».
3. Comunidades: núcleos, Tuna, clubes e Associação Académica.
4. Avaliações de 1 a 5 estrelas depois do evento.
5. Notificações em tempo real, configuráveis (77% receia excesso de notificações) e lembretes antes do evento.
6. Registo apenas com email institucional, sem anúncios.

## O Significado por detrás do nome

O nome **Come Together** é inspirado na música homónima dos **The Beatles**, lançada em 1969.

Mais do que uma referência musical, o nome representa a ideia central do projeto: aproximar pessoas.

No contexto do IPVC, isso significa ligar estudantes de diferentes escolas, polos e áreas de estudo, criando oportunidades para descobrir interesses em comum, participar em comunidades e partilhar experiências.

A aplicação procura tornar uma instituição geograficamente dispersa num espaço mais conectado, onde a distância entre escolas não seja uma barreira à interação e ao sentimento de pertença.

**Come Together não é apenas sobre descobrir o que acontece. É sobre aproximar as pessoas que fazem acontecer.**


## Identidade visual

A identidade visual do Come Together: UNIPVC inspira-se na cidade e na tradição de Viana do Castelo, procurando estabelecer uma ligação entre a aplicação e a identidade cultural da região.

A paleta cromática tem três referências principais:

1. **Azuis:** Representam o mar e a ligação histórica e geográfica de Viana do Castelo ao Atlântico.
2. **Vermelho:** Inspirado nos tons característicos dos trajes tradicionais de Viana do Castelo.
3. **Dourado:** Remete para os bordados, adornos e ourivesaria tradicionais associados à cultura minhota.

Os tons areia complementam a paleta, proporcionando equilíbrio e luminosidade à interface.

Desta forma, a aplicação procura combinar uma identidade visual contemporânea com elementos representativos do património cultural e geográfico da região.

## Funcionalidades implementadas

1. Registo e início de sessão com email institucional: código de 6 dígitos por email e sessão com JWT de 7 dias. Existe uma conta de administração.
2. Perfis: nome, username, foto, escola, tipo de membro (Estudante, Staff, Erasmus), curso e bio, tudo editável em «Editar perfil» (o curso depende da escola e não se aplica a Staff). Pesquisa de pessoas por nome ou username, seguir e deixar de seguir, listas de seguidores e seguidos.
3. Eventos: criar, listar com filtros (escola, texto, datas, origem, vistas Próximos, Eu vou, Meus e Passados), página do evento, «Eu vou» e cancelar. Os eventos oficiais são criados pela conta de administração.
4. Notificações em tempo real com Socket.IO: quando alguém marca «Eu vou» num evento teu, o sino mostra um contador de não lidas e a lista de notificações, que fica guardada na base de dados.
5. Definições e perfil: o perfil tem avatar, escola, curso e contadores de seguidores, e a engrenagem do separador Perfil abre as Definições, onde cada utilizador liga ou desliga os avisos de «Eu vou» e os lembretes de eventos. O botão voltar regressa sempre ao ecrã anterior.
6. Lembretes (RF41): cerca de 1 hora antes de um evento, quem marcou «Eu vou» recebe uma notificação na app, em tempo real se estiver ligado, desde que tenha os lembretes ligados nas Definições.
7. Denúncias e administração (RF37, parcial): qualquer membro pode denunciar um evento ou um perfil com um motivo. A conta de administração vê a fila de denúncias abertas, pode cancelar o evento denunciado e marca cada denúncia como resolvida ou ignorada.
8. Estados vazio, erro e carregamento nos ecrãs de eventos, notificações, perfil e comunidades.
9. Comunidades (RF27, RF28): criar comunidade (nome único de 3 a 40 caracteres, descrição até 80, pública ou privada), pesquisar, filtrar por «As minhas», entrar numa pública ou pedir para entrar numa privada, cancelar o pedido e sair. Quem cria fica administrador da comunidade e pode editar o nome, a descrição e a privacidade, aceitar ou recusar pedidos, promover e despromover administradores e remover membros. Numa comunidade privada, só os membros veem a lista de membros.

Em desenvolvimento: mapa por campus, feed, avaliações, eventos em nome de uma comunidade e seguir comunidades. Ver a tabela de requisitos mais abaixo.

## Stack

| Parte | Escolha |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, ESLint (`/client`) |
| Backend | Node.js e Express, CommonJS (`/server`) |
| Base de dados | MongoDB Atlas (M0) com Mongoose |
| Autenticação | Código de 6 dígitos por email (guardado com hash, expira em 10 minutos) e JWT |
| Email | Brevo (API HTTPS, plano gratuito) |
| Tempo real | Socket.IO |
| Mapa (previsto) | Leaflet e OpenStreetMap |
| Deploy | Render (API) e Vercel (cliente) |

Restrição do grupo: tudo gratuito. Por isso os avatares ficam guardados no MongoDB, porque o disco do Render é efémero.
## Estrutura

~~~
/client   Vite React
  /src    App.jsx (shell e navegação), Access.jsx (splash, login, código, setup),
          Events.jsx, EventPage.jsx, CreateEvent.jsx, Notifications.jsx, Notice.jsx,
          Communities.jsx, CommunityPage.jsx, CreateCommunity.jsx, CommunityBadge.jsx, communities.js,
          Settings.jsx, NotificationSettings.jsx,
          Profile.jsx, ProfileForm.jsx, UserSearch.jsx, Admin.jsx, ReportButton.jsx, AuthProvider.jsx, api.js, socket.js,
          useNotifications.js, schools.js, ...
/server   Express API
  /src/index.js          arranque, rotas e Socket.IO
  /src/realtime.js       servidor Socket.IO com autenticação por JWT
  /src/notify.js         criação e envio de notificações
  /src/reminders.js      lembretes 1 hora antes do evento (verificação a cada minuto)
  /src/permissions.js    isAdmin, canManageEvent, isCommunityAdmin e canManageCommunity
  /src/constants.js      escolas e tipos de membro
  /src/serializers.js
  /src/models            User, LoginCode, Event, Notification, Report, Community
  /src/routes            auth, users, events, notifications, reports, communities
  /src/middleware        auth (requireAuth, requireAdmin)
~~~

## Como correr localmente

Pré-requisitos: Git, VS Code e Node.js 18 ou superior (recomendado 20 LTS). Comandos em PowerShell.

1. Clonar e instalar as dependências, uma vez em cada pasta:

~~~powershell
git clone https://github.com/psousa13/come-together-unipvc.git
cd come-together-unipvc
cd server
npm install
cd ..\client
npm install
cd ..
~~~

2. Criar o `server\.env` a partir do exemplo e preenchê-lo (sem aspas, sem espaços à volta do `=`):

~~~powershell
Copy-Item server\.env.example server\.env
code server\.env
~~~

3. Gerar um `JWT_SECRET`:

~~~powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
~~~
4. Base de dados: criar um cluster gratuito (M0) no MongoDB Atlas e um utilizador de base de dados, e em Network Access permitir o teu IP. A connection string tem o formato `mongodb+srv://<utilizador>:<password>@<cluster>/<nome-da-bd>?...`. Passwords com caracteres especiais têm de ser codificadas em URL. Em local, usar um nome de base de dados diferente do de produção.

5. Criar o `client\.env` com o conteúdo:

~~~
VITE_API_URL=http://localhost:3000
~~~

6. Arrancar, em dois terminais (cada `npm run dev` corre dentro da sua pasta, nunca na raiz):

~~~powershell
cd server
npm run dev
~~~

~~~powershell
cd client
npm run dev
~~~

O servidor deve imprimir `MongoDB connected` e `API on port 3000`. Abrir `http://localhost:5173`.

7. Entrar na app: com qualquer email `@ipvc.pt`, pedir o código e copiá-lo do terminal do servidor, da linha `[DEV] Login code for ...` (sem `BREVO_API_KEY` e `MAIL_FROM` o email não é enviado). Para entrar como administração, escrever `admin` no campo de email e usar a `ADMIN_PASSWORD`.

## Variáveis de ambiente

Nunca fazer commit de valores reais. Os `.env` estão no `.gitignore` e os nomes estão em `server/.env.example`.

| Variável | Onde | Notas |
|---|---|---|
| `MONGODB_URI` | server | Connection string do Atlas, com o nome da base de dados antes do `?` |
| `JWT_SECRET` | server | String longa e aleatória, diferente em local e em produção |
| `ADMIN_PASSWORD` | server | Password da conta de administração |
| `ALLOWED_EMAIL_DOMAINS` | server | Lista separada por vírgulas, por defeito `ipvc.pt` (aceita subdomínios) |
| `CLIENT_URL` | server | Origem permitida (CORS e Socket.IO), sem barra final |
| `BREVO_API_KEY` | server | Chave da API do Brevo, só para emails transacionais |
| `MAIL_FROM` | server | Remetente verificado no Brevo |
| `PORT` | server | Só em local (3000) |
| `NODE_ENV` | server | `production` no Render |
| `DNS_SERVERS` | server | Opcional, só em local, para redes que bloqueiam consultas SRV |
| `VITE_API_URL` | client | URL da API, sem barra final (também é o endereço do Socket.IO) |
Problemas comuns:

| Sintoma | Causa provável |
|---|---|
| `querySrv ECONNREFUSED` | A rede bloqueia consultas SRV: acrescentar `DNS_SERVERS=8.8.8.8,1.1.1.1` ao `server\.env` |
| `MongooseServerSelectionError` | O teu IP não está em Network Access, ou credenciais erradas |
| `NetworkError when attempting to fetch resource` | O servidor não está a correr, ou `VITE_API_URL` errado |
| Erro de CORS no browser | `CLIENT_URL` diferente de `http://localhost:5173`; reiniciar o servidor |
| «Demasiados pedidos de código» | Limite de 5 pedidos por IP a cada 15 minutos; esperar ou reiniciar o servidor |

## API

Base: `/api`. Os erros vêm em PT-PT no formato `{ "error": "..." }`. Todas as rotas, exceto as de `/auth` e `/health`, exigem o cabeçalho `Authorization: Bearer <token>`.

| Método e rota | O que faz |
|---|---|
| `GET /api/health` | `{ ok: true }` |
| `POST /api/auth/request-code` | Envia o código de login para o email institucional |
| `POST /api/auth/verify-code` | Valida o código e devolve `{ token, user }` (cria a conta no primeiro login) |
| `POST /api/auth/admin-login` | Login da conta de administração |
| `GET /api/auth/me` | Utilizador da sessão |
| `GET /api/users?q=` | Pesquisa de pessoas por username ou nome |
| `GET /api/users/username-available?username=` | Verifica se o username está livre |
| `PATCH /api/users/me` | Edita o perfil e as preferências de notificações (`notificationPrefs`: `going` e `reminders`) |
| `GET /api/users/:username` | Perfil público |
| `POST` e `DELETE /api/users/:username/follow` | Seguir e deixar de seguir |
| `GET /api/users/:username/followers` e `/following` | Listas de seguidores e seguidos |
| `GET /api/events` | Lista com filtros: `school`, `origin`, `from`, `to`, `q`, `going`, `mine`, `past`, `limit`, `page` |
| `POST /api/events` | Cria evento |
| `GET /api/events/:id` | Detalhe do evento |
| `POST` e `DELETE /api/events/:id/going` | Marca e desmarca «Eu vou» |
| `POST /api/events/:id/cancel` | Cancela (organizador ou administração) |
| `GET /api/notifications` | Últimas 50 notificações do utilizador (tipos `going` e `reminder`) |
| `POST /api/notifications/read-all` | Marca todas como lidas |
| `POST /api/reports` | Denuncia um evento ou um perfil (`targetType`, `targetId`, `reason`, `details`). Uma denúncia aberta por pessoa e alvo |
| `GET /api/reports` | Fila de denúncias abertas (só administração) |
| `PATCH /api/reports/:id` | Marca como `resolved` ou `dismissed` (só administração) |
| `GET /api/communities` | Lista por ordem alfabética (máximo 100), com filtros `q` (2 caracteres no mínimo) e `mine=1` |
| `POST /api/communities` | Cria comunidade (`name`, `description`, `isPrivate`); quem cria fica administrador e membro |
| `GET /api/communities/:id` | Detalhe, com até 50 membros (numa privada, só para membros) e os pedidos pendentes (só para quem gere) |
| `PATCH /api/communities/:id` | Edita nome, descrição e privacidade; ao passar de privada a pública, os pedidos pendentes são aceites |
| `POST` e `DELETE /api/communities/:id/join` | Entra (pública) ou pede para entrar (privada); sai ou cancela o pedido. O único administrador não pode sair |
| `POST` e `DELETE /api/communities/:id/requests/:username` | Aceita ou recusa um pedido (administradores da comunidade) |
| `POST` e `DELETE /api/communities/:id/admins/:username` | Promove ou despromove um membro; tem de ficar pelo menos um administrador |
| `DELETE /api/communities/:id/members/:username` | Remove um membro que não seja administrador |

Limites de pedidos (por IP, janela de 15 minutos): 5 pedidos de código e 20 tentativas falhadas de verificação ou de login de administração. As rotas de eventos, notificações, denúncias e comunidades não têm limite próprio.
## Tempo real

O cliente liga-se ao Socket.IO com o JWT em `auth.token`. O servidor valida o token e coloca a ligação na sala `user:<id>`. Quando alguém marca «Eu vou» pela primeira vez num evento de outra pessoa, o servidor guarda uma notificação e emite o evento `notification` para o organizador. A mesma pessoa a repetir a ação no mesmo evento não gera uma segunda notificação, e o organizador não é notificado das suas próprias marcações. Se o organizador estiver offline, a notificação fica na base de dados e aparece quando abrir a app. O organizador pode desligar estes avisos nas Definições (`notificationPrefs.going`): com o interruptor desligado, a notificação não é criada nem enviada.

## Lembretes

O servidor verifica no arranque e a cada minuto os eventos que começam na próxima hora, que não estão cancelados e ainda não tiveram lembretes (`remindersSentAt`). Marca o evento antes de enviar, para nunca duplicar, e cria uma notificação do tipo `reminder` para cada pessoa que marcou «Eu vou» e tem `notificationPrefs.reminders` ligado, emitida também em tempo real. Os lembretes são só dentro da app, sem email, por causa do limite de 300 emails por dia do Brevo.

## Permissões e denúncias

Há três níveis: membro, administrador de comunidade e administração. `server/src/permissions.js` centraliza as regras: `canManageEvent` (o organizador ou a administração) e `canManageCommunity` (um administrador da comunidade ou a administração). Uma comunidade pode ter vários administradores e tem sempre pelo menos um. A conta de administração não participa em comunidades. Qualquer membro com username pode denunciar um evento ou um perfil, e a administração trata a fila no seu ecrã.

## Deploy

1. Base de dados: MongoDB Atlas (M0), com `0.0.0.0/0` na IP Access List porque o IP de saída do Render muda. A password da base de dados é, por isso, a única proteção: fica fora do Git.
2. API: Render (plano gratuito), com as variáveis da tabela acima em Environment.
3. Cliente: Vercel, com Root Directory `client`, preset Vite e `VITE_API_URL` a apontar para a API.
4. O Render e o Vercel fazem redeploy automático quando o `main` muda.

## Fluxo de trabalho

O `main` está protegido: toda a alteração passa por branch e Pull Request.

~~~powershell
git checkout main
git pull
git checkout -b feat/<nome>
cd client; npm run lint; cd ..
cd server; npm run lint; cd ..
git add .
git commit -m "feat(<area>): <o quê>"
git push -u origin feat/<nome>
~~~

Depois abre-se o PR no GitHub e faz-se o merge. Antes do PR, `npm run build` na pasta `client` confirma que o Vercel consegue construir.
## Requisitos do MVP

| ID | Requisito | Estado |
|---|---|---|
| RF01 | Registo com email institucional e código | Feito |
| RF02 | Iniciar e terminar sessão | Feito |
| RF05 | Perfil: nome, username, foto e escola | Feito |
| RF07 | Seguir pessoas e comunidades | Parcial (só pessoas) |
| RF10 | Criar evento sem aprovação | Feito (testado em local) |
| RF11 | Evento em nome próprio ou de comunidade | Parcial (só em nome próprio) |
| RF12 | Marcar e desmarcar «Eu vou» | Feito (testado em local) |
| RF13 | Lista de eventos com filtros | Feito (testado em local) |
| RF14 | Página do evento | Feito (testado em local) |
| RF19 | Feed de seguidos e comunidades | Por fazer |
| RF20 | Avaliar evento de 1 a 5 estrelas | Por fazer |
| RF24 | Mapa centrado na escola | Por fazer |
| RF27 | Criar comunidade | Feito (testado em local) |
| RF28 | Comunidades públicas e privadas | Feito (testado em local) |
| RF32 | Notificação em tempo real do «Eu vou» | Feito (testado em local) |
| RF36 | Configurar notificações | Feito (testado em local) |
| RF37 | Três níveis de permissões | Feito (membro, administrador de comunidade e administração, com fila de denúncias; testado em local) |
| RF41 | Lembretes antes do evento | Feito (1 hora antes, só dentro da app, testado em local) |

## Limitações conhecidas

1. O plano gratuito do Render adormece: o primeiro pedido, e a ligação em tempo real, podem demorar cerca de 1 minuto.
2. Os códigos de login enviados pelo Brevo (remetente Gmail pessoal) podem ir para a pasta de spam.
3. Só são aceites emails dos domínios em `ALLOWED_EMAIL_DOMAINS`.
4. O ecrã de criar evento só aceita uma data, por isso não permite eventos que acabam depois da meia-noite.
5. Os lembretes (RF41) são enviados uma só vez, a quem já marcou «Eu vou» nessa altura. Quem marca depois, ou um evento criado com menos de 1 hora de antecedência, não gera lembrete. Se o servidor estiver a dormir na hora certa, o lembrete só sai quando acordar e só se o evento ainda não tiver começado.
6. «Resolver» numa denúncia só a fecha: não há suspensão de contas nem aviso a quem denunciou.
7. A administração só vê a fila de denúncias quando abre o ecrã, sem avisos em tempo real.
8. As rotas de eventos, de denúncias e de comunidades não têm limite de pedidos próprio.
9. A página de uma comunidade mostra no máximo 50 membros e a lista mostra no máximo 100 comunidades, sem paginação.
10. Os pedidos para entrar numa comunidade privada não geram notificação: os administradores só os veem quando abrem a página da comunidade.

## Uso de IA

O uso de IA neste projeto está registado de forma transparente.

1. **Claude (Anthropic):** Utilizado como ferramenta de apoio ao desenvolvimento, auxiliando na escrita, revisão e organização do código, incluindo os eventos, as notificações em tempo real, os lembretes, as denúncias, o redesenho dos perfis, as comunidades (modelo, API e ecrãs) e este documento.

2. **Figma Make:** Utilizado para criar o protótipo visual da aplicação, desenvolvido separadamente do repositório do projeto.

3. **ChatGPT (OpenAI):** Utilizado numa parte da escrita de `Access.jsx`. O resultado foi verificado e completado com o Claude.

Nenhuma IA tem acesso direto ao disco, ao repositório ou às contas do grupo: só vê os ficheiros que o grupo lhe envia, e chaves e passwords nunca lhe são enviadas. Todo o código é executado e testado por pessoas, e só se dá como confirmado o que foi visto em output.

## Equipa

Grupo PFSIR_G13: Pedro Sousa Esteves (33418) e Simão Gigante (33403).
