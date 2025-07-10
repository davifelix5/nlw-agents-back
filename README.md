
# NLW Agents - Backend

Este é o backend do projeto NLW Agents, uma plataforma de Perguntas e Respostas (Q&A) potencializada por Inteligência Artificial. A aplicação permite a criação de "salas" temáticas, onde os usuários podem fazer upload de áudios que são transcritos e usados como contexto para que uma IA generativa responda a perguntas.

## 🚀 Escopo do Projeto

O objetivo principal é fornecer uma API RESTful para gerenciar salas, perguntas e o processamento de áudio. O fluxo principal consiste em:

1.  **Criação de Salas**: Um usuário pode criar uma sala com um título específico (ex: "Aula de React").
2.  **Upload de Áudio**: Para cada sala, é possível fazer o upload de um arquivo de áudio.
3.  **Transcrição e Geração de Embeddings**: O áudio é enviado para a API do Gemini, que o transcreve para texto. Em seguida, o texto transcrito é transformado em *embeddings* (vetores numéricos) e armazenado no banco de dados.
4.  **Criação de Perguntas**: O usuário pode fazer uma pergunta dentro de uma sala.
5.  **Busca de Contexto e Geração de Resposta**: Ao receber uma pergunta, o sistema a converte em *embeddings* e busca os trechos de texto transcrito mais relevantes no banco de dados (usando busca por similaridade de vetores). Esses trechos são usados como contexto para a IA do Gemini gerar uma resposta precisa e focada.

## ✨ Tecnologias Utilizadas

-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
-   **Framework**: [Fastify](https://www.fastify.io/) para construção da API, com foco em alta performance.
-   **Banco de Dados**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/) para interação com o banco de dados de forma type-safe.
-   **Validação**: [Zod](https://zod.dev/) para validação de schemas e tipos de dados nas rotas da API.
-   **Containerização**: [Docker](https://www.docker.com/) para gerenciar o ambiente do banco de dados.
-   **Tooling**: [Biome](https://biomejs.dev/) para formatação e linting do código.

## 🔗 Integrações

### API do Google Gemini

#### Como a Integração com Gemini é Utilizada

A API do Gemini é utilizada em três momentos cruciais do fluxo da aplicação, através do serviço `src/services/gemini.ts`:

1.  **Transcrição de Áudio (`transcribeAudio`)**:
    -   **Modelo**: `gemini-1.5-flash`
    -   **Função**: Recebe um áudio (em base64) e o transcreve para texto em português do Brasil. Um prompt inicial instrui o modelo a ser preciso e a manter a pontuação adequada.

2.  **Geração de Embeddings (`generateEmbeddings`)**:
    -   **Modelo**: `text-embedding-004`
    -   **Função**: Transforma um trecho de texto (seja da transcrição ou de uma pergunta) em um vetor numérico (*embedding*). Isso é essencial para a busca de similaridade semântica. A configuração `taskType: "RETRIEVAL_DOCUMENT"` otimiza os embeddings para tarefas de busca de contexto.

3.  **Geração de Respostas (`generateAnswer`)**:
    -   **Modelo**: `gemini-1.5-flash`
    -   **Função**: Implementa o padrão RAG (Retrieval-Augmented Generation). A função recebe a pergunta do usuário e os trechos de texto mais relevantes (encontrados via busca de similaridade de embeddings) como contexto. Um prompt detalhado instrui o modelo a responder a pergunta **usando apenas as informações fornecidas no contexto**, garantindo que as respostas sejam fiéis ao conteúdo da "aula" (áudio).

### Extensão de vetorização do PostgreSQL (pgvector)

#### Como a extensão pgvector foi utilizada

1.  **Armazenamento de Embeddings:**  
  Cada transcrição de áudio ou pergunta é convertida em um vetor numérico (embedding) usando o Gemini. Esses vetores são salvos em uma coluna do tipo `vector` no PostgreSQL.

2.  **Busca por Similaridade:**  
  Quando o usuário faz uma pergunta, o texto é convertido em embedding e o PostgreSQL é usado para buscar, no banco, os vetores mais próximos (semelhantes) usando funções da extensão `vector` (como distância euclidiana ou cosseno). Isso permite encontrar rapidamente os trechos de texto mais relevantes para responder à pergunta.

## ⚙️ Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd backend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    -   Copie o arquivo `.env.sample` para um novo arquivo chamado `.env`.
    -   Preencha a variável `GEMINI_API_KEY` com sua chave da API do Google Gemini.
    -   Ajuste a porta na qual deseja que sua aplicação rode
    -   Ajuste a URL no banco de dados de acordo com o que você definiu no seu arquivo `docker-compose.yaml` 
    ```bash
    cp .env.sample .env
    ```

4.  **Inicie o banco de dados com Docker:**
    ```bash
    docker-compose up -d
    ```

5.  **Execute as migrações do banco de dados:**
    ```bash
    npm run db:migrate
    ```

6.  **(Opcional) Popule o banco de dados com dados de teste:**
    ```bash
    npm run db:seed
    ```

7.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

O servidor estará disponível em `http://localhost:3333`.

## Drizze Studio

O projeto também está integrado com o **Drizzle Studio**, que uma interface gráfica para visualizar e gerenciar o banco de dados de forma prática durante o desenvolvimento. Ele permite explorar tabelas, consultar dados, editar registros e executar queries SQL diretamente, facilitando o debug e a validação do modelo de dados.

### Como rodar o Drizzle Studio

1. **Execute o comando:**
    ```bash
    npm run db:studio
    ```

2. O Drizzle Studio será iniciado e exibirá um link no terminal (geralmente `http://localhost:5555`). Acesse esse endereço no navegador para utilizar a interface.

### Por que utilizar o Drizzle Studio?

- Visualização rápida das tabelas e dados do banco.
- Edição e inserção de registros sem necessidade de comandos SQL manuais.
- Execução de queries customizadas para testes e validações.
- Facilita o desenvolvimento, debug e manutenção do banco de dados.


## 🗺️ Endpoints da API

-   `GET /health`: Verifica o status da aplicação.
-   `GET /rooms`: Lista todas as salas.
-   `POST /rooms`: Cria uma nova sala.
    -   **Body**: `{ "title": "string" }`
-   `GET /rooms/:roomId/questions`: Lista as perguntas de uma sala específica.
-   `POST /rooms/:roomId/questions`: Cria uma nova pergunta em uma sala.
    -   **Body**: `{ "content": "string" }`
-   `POST /uploads/audio`: Faz o upload de um áudio para uma sala.
    -   **Tipo**: `multipart/form-data`
    -   **Campos**: `roomId` (string), `file` (arquivo de áudio).
