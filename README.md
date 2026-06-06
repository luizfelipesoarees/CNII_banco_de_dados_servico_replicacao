# Computação em Nuvem II - Fatec
**Projeto: Replicação de Banco de Dados com Separação de Leitura e Escrita (Read/Write Separation)**

Projeto desenvolvido para a matéria de Computação em Nuvem II da Fatec. 
O objetivo deste sistema é demonstrar, na prática, o funcionamento de um proxy que roteia requisições de banco de dados em um cluster. As requisições de escrita (INSERT, UPDATE, DELETE) são direcionadas para o banco **Primary (Mestre)**, enquanto as requisições de leitura (SELECT, COUNT, AVG) são balanceadas em formato *Round-Robin* entre diversas **Réplicas (Slaves)**, aliviando a carga do servidor principal.

## 👥 Integrantes
* Felipe Avelino Pedaes;
* Gabriel Resende Spirlandelli;
* Henrique Almeida Florentino;
* Luiz Felipe Vieira Soares;

---

## 💻 Como Rodar o Projeto Localmente

Para testes em desenvolvimento, o projeto conta com um ambiente local utilizando o Docker para subir múltiplos bancos MySQL independentes, e um script customizado que simula o *delay* da replicação de dados entre eles.

1. **Suba os containers do banco de dados:**
   Na raiz do projeto, rode o seguinte comando para inicializar o banco Primary e as duas Réplicas.
   ```bash
   docker-compose up -d
   ```

2. **Configure as Variáveis de Ambiente:**
   Certifique-se de que o seu arquivo `.env` está configurado para apontar para os bancos locais e que a variável `SIMULATE_REPLICATION` está ativada.
   ```env
   DATABASE_WRITE_URL="mysql://root:mysql@localhost:3306/aula-db"
   DATABASE_READ_1_URL="mysql://root:mysql@localhost:3307/aula-db"
   DATABASE_READ_2_URL="mysql://root:mysql@localhost:3308/aula-db"
   
   SIMULATE_REPLICATION="true"
   GROUP_NAME="Grupo09"
   PORT=3000
   ```

3. **Instale as dependências e inicie a API:**
   ```bash
   npm install
   npm run dev
   ```

4. **Inicie o Simulador de Tráfego:**
   Em um segundo terminal, rode o script simulador para começar a inserir clientes, produtos e pedidos automaticamente na base de dados.
   ```bash
   npm run script
   ```

---

## ☁️ Como Rodar o Projeto com Bancos em Nuvem (GCP / AWS)

Quando o projeto for hospedado ou conectado a bancos de dados na nuvem (como o Cloud SQL do Google Cloud Platform), a replicação de dados passa a ser responsabilidade **nativa** do próprio provedor de nuvem.

Isso significa que o nosso script manual de replicação local deve ser **desativado**, deixando apenas o Proxy de roteamento de queries ativo.

1. **Desative a Replicação Automática do Sistema:**
   No arquivo `.env`, troque o valor de `SIMULATE_REPLICATION` para `"false"`. Isso evita que a API tente espelhar os dados no código (já que a nuvem fará isso por nós muito mais rápido).
   ```env
   SIMULATE_REPLICATION="false"
   ```

2. **Atualize as Credenciais (`.env`):**
   Substitua as URLs locais pelos IPs Públicos (ou Privados) fornecidos pelo painel da sua nuvem.
   ```env
   DATABASE_WRITE_URL="mysql://usuario:senha@IP_DO_MASTER:3306/aula-db"
   DATABASE_READ_1_URL="mysql://usuario:senha@IP_DA_REPLICA_1:3306/aula-db"
   DATABASE_READ_2_URL="mysql://usuario:senha@IP_DA_REPLICA_2:3306/aula-db"
   # Você pode adicionar quantas réplicas quiser seguindo o padrão DATABASE_READ_X_URL
   ```

3. **Inicie a aplicação:**
   As tabelas e infraestrutura já devem estar provisionadas na nuvem. Inicie a API normalmente.
   ```bash
   npm run dev
   ```
   A aplicação continuará roteando inteligentemente o tráfego de leitura para os IPs das réplicas e a escrita para o Master, aproveitando o poder da infraestrutura em nuvem!
