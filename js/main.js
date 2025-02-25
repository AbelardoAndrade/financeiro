// Variáveis globais
let mesAtual;
let anoAtual;
let despesasAtuais = [];

// Elementos DOM
const mesSelect = document.getElementById('mes-atual');
const anoSelect = document.getElementById('ano-atual');
const btnCarregarPeriodo = document.getElementById('btn-carregar-periodo');
const btnAdicionarDespesa = document.getElementById('btn-adicionar-despesa');
const btnArquivarMes = document.getElementById('btn-arquivar-mes');
const btnExportarExcel = document.getElementById('btn-exportar-excel');
const tabButtons = document.querySelectorAll('.tab-btn');
const formDespesa = document.getElementById('form-despesa');
const filtroTipo = document.getElementById('filtro-tipo');
const filtroStatus = document.getElementById('filtro-status');
const filtroCategoria = document.getElementById('filtro-categoria');
const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');

// Modais
const modalDespesa = document.getElementById('modal-despesa');
const modalConfirmar = document.getElementById('modal-confirmar');
const modalArquivar = document.getElementById('modal-arquivar');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Main app initialization is now handled by auth.js
    // after successful login via initializeAppForUser function
    
    // Configura todos os event listeners
    configurarEventListeners();
});

// Preenche o select de anos (10 anos para trás e 5 para frente)
function preencherSelectAnos() {
    const anoAtual = new Date().getFullYear();
    const anoInicial = anoAtual - 10;
    const anoFinal = anoAtual + 5;
    
    // Clear existing options
    anoSelect.innerHTML = '';
    
    for (let ano = anoInicial; ano <= anoFinal; ano++) {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        
        if (ano === anoAtual) {
            option.selected = true;
        }
        
        anoSelect.appendChild(option);
    }
}

// Configura os event listeners
function configurarEventListeners() {
    // Botões principais
    btnCarregarPeriodo.addEventListener('click', () => {
        const mesSelec = parseInt(mesSelect.value);
        const anoSelec = parseInt(anoSelect.value);
        carregarDadosPeriodo(mesSelec, anoSelec);
    });
    
    btnAdicionarDespesa.addEventListener('click', () => abrirModalDespesa());
    
    btnArquivarMes.addEventListener('click', () => {
        document.getElementById('modal-arquivar').style.display = 'block';
    });
    
    btnExportarExcel.addEventListener('click', () => {
        const nomeArquivo = exportarExcel(despesasAtuais, mesAtual, anoAtual);
        mostrarNotificacao(`Arquivo ${nomeArquivo} exportado com sucesso!`);
    });
    
    // Botões de confirmação arquivar mês
    document.getElementById('btn-confirmar-arquivar').addEventListener('click', () => {
        arquivarMesAtual();
    });
    
    document.getElementById('btn-cancelar-arquivar').addEventListener('click', () => {
        modalArquivar.style.display = 'none';
    });
    
    // Tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe active de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Adiciona a classe active ao botão clicado e ao conteúdo correspondente
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Modais
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Fechar modais quando clicar fora
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Formulário de despesa
    formDespesa.addEventListener('submit', function(e) {
        e.preventDefault();
        salvarDespesa();
    });
    
    document.getElementById('btn-cancelar').addEventListener('click', function() {
        modalDespesa.style.display = 'none';
    });
    
    // Tipo de despesa (mensal/avulso)
    document.querySelectorAll('.tab-tipo').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab-tipo').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('despesa-tipo').value = this.getAttribute('data-tipo');
        });
    });
    
    // Status de pagamento
    document.getElementById('despesa-status').addEventListener('change', function() {
        const campoPagamento = document.getElementById('campo-data-pagamento');
        if (this.value === 'pago') {
            campoPagamento.style.display = 'block';
            document.getElementById('despesa-data-pagamento').value = new Date().toISOString().split('T')[0];
        } else {
            campoPagamento.style.display = 'none';
            document.getElementById('despesa-data-pagamento').value = '';
        }
    });
    
    // Formatação de valor
    document.getElementById('despesa-valor').addEventListener('input', function() {
        // Remove tudo que não é número
        let valor = this.value.replace(/\D/g, '');
        
        // Converte para formato de moeda
        if (valor === '') {
            this.value = '';
        } else {
            // Formata como moeda (divide por 100 para obter valor com 2 casas decimais)
            valor = (parseFloat(valor) / 100).toFixed(2);
            this.value = valor.replace('.', ',');
        }
    });
    
    // Filtros
    btnAplicarFiltros.addEventListener('click', aplicarFiltros);
}

// Carregar dados do período selecionado
function carregarDadosPeriodo(mes, ano) {
    mesAtual = mes;
    anoAtual = ano;
    
    // Atualiza a interface
    document.getElementById('despesas-body').innerHTML = '';
    
    // Carrega as despesas
    despesasAtuais = obterDespesasPorPeriodo(mes, ano);
    renderizarDespesas(despesasAtuais);
    
    // Atualiza o dashboard
    atualizarDashboard();
    
    mostrarNotificacao(`Dados de ${obterNomeMes(mes)} de ${ano} carregados com sucesso.`);
}

// Renderiza as despesas na tabela
function renderizarDespesas(despesas) {
    const tbody = document.getElementById('despesas-body');
    tbody.innerHTML = '';
    
    if (despesas.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="7" class="empty-state">
                Nenhuma despesa encontrada para este período.
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }
    
    despesas.forEach(despesa => {
        const tr = document.createElement('tr');
        
        // Verifica se está atrasado
        const status = despesa.status === 'pago' ? 'pago' : 
                      (estaVencida(despesa.data_vencimento) ? 'atrasado' : 'pendente');
        
        tr.innerHTML = `
            <td>${despesa.descricao}</td>
            <td>${despesa.categoria.charAt(0).toUpperCase() + despesa.categoria.slice(1)}</td>
            <td>
                <span class="tag tag-${despesa.tipo}">
                    ${despesa.tipo === 'mensal' ? 'Mensal' : 'Avulso'}
                </span>
            </td>
            <td>${formatarMoeda(parseFloat(despesa.valor))}</td>
            <td>${formatarData(despesa.data_vencimento)}</td>
            <td>
                <span class="status status-${status}">
                    ${status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            </td>
            <td class="acoes">
                ${despesa.status !== 'pago' ? 
                  `<button class="btn-acao btn-pagar" data-id="${despesa.id}" title="Marcar como pago">
                      <i class="fas fa-check-circle"></i>
                   </button>` : ''}
                <button class="btn-acao btn-editar" data-id="${despesa.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-acao btn-excluir" data-id="${despesa.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Adiciona event listeners aos botões de ação
    adicionarEventosAcoes();
}

// Adiciona eventos aos botões de ação da tabela
function adicionarEventosAcoes() {
    // Botão Pagar
    document.querySelectorAll('.btn-pagar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            
            document.getElementById('mensagem-confirmar').textContent = 
                "Tem certeza que deseja marcar esta despesa como paga hoje?";
            
            document.getElementById('btn-confirmar-sim').onclick = function() {
                const hoje = new Date().toISOString().split('T')[0];
                if (marcarComoPaga(id, hoje)) {
                    carregarDadosPeriodo(mesAtual, anoAtual);
                    mostrarNotificacao("Despesa marcada como paga com sucesso.");
                }
                modalConfirmar.style.display = 'none';
            };
            
            document.getElementById('btn-confirmar-nao').onclick = function() {
                modalConfirmar.style.display = 'none';
            };
            
            modalConfirmar.style.display = 'block';
        });
    });
    
    // Botão Editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            abrirModalDespesa(id);
        });
    });
    
    // Botão Excluir
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            
            document.getElementById('mensagem-confirmar').textContent = 
                "Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.";
            
            document.getElementById('btn-confirmar-sim').onclick = function() {
                if (excluirDespesa(id)) {
                    carregarDadosPeriodo(mesAtual, anoAtual);
                    mostrarNotificacao("Despesa excluída com sucesso.");
                }
                modalConfirmar.style.display = 'none';
            };
            
            document.getElementById('btn-confirmar-nao').onclick = function() {
                modalConfirmar.style.display = 'none';
            };
            
            modalConfirmar.style.display = 'block';
        });
    });
}

// Abre o modal para adicionar/editar despesa
function abrirModalDespesa(id = null) {
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-despesa');
    
    // Limpar o formulário
    form.reset();
    
    if (id) {
        // Modo Edição
        modalTitulo.textContent = 'Editar Despesa';
        
        const despesa = obterDespesaPorId(id);
        if (!despesa) {
            mostrarNotificacao("Despesa não encontrada.", "error");
            return;
        }
        
        // Preencher o formulário
        document.getElementById('despesa-id').value = despesa.id;
        document.getElementById('despesa-descricao').value = despesa.descricao;
        document.getElementById('despesa-categoria').value = despesa.categoria;
        document.getElementById('despesa-tipo').value = despesa.tipo;
        document.getElementById('despesa-valor').value = parseFloat(despesa.valor).toFixed(2).replace('.', ',');
        document.getElementById('despesa-vencimento').value = despesa.data_vencimento;
        document.getElementById('despesa-status').value = despesa.status;
        document.getElementById('despesa-observacoes').value = despesa.observacoes || '';
        
        // Selecionar o tipo correto
        document.querySelectorAll('.tab-tipo').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tipo') === despesa.tipo) {
                tab.classList.add('active');
            }
        });
        
        // Mostrar/esconder campo de data de pagamento
        const campoPagamento = document.getElementById('campo-data-pagamento');
        if (despesa.status === 'pago') {
            campoPagamento.style.display = 'block';
            document.getElementById('despesa-data-pagamento').value = despesa.data_pagamento || '';
        } else {
            campoPagamento.style.display = 'none';
        }
    } else {
        // Modo Adição
        modalTitulo.textContent = 'Adicionar Despesa';
        document.getElementById('despesa-id').value = '';
        document.getElementById('despesa-status').value = 'pendente';
        document.getElementById('campo-data-pagamento').style.display = 'none';
        
        // Data de vencimento padrão para o final do mês
        const ultimoDiaMes = new Date(anoAtual, mesAtual, 0).getDate();
        document.getElementById('despesa-vencimento').value = 
            `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(ultimoDiaMes).padStart(2, '0')}`;
    }
    
    // Exibir o modal
    modalDespesa.style.display = 'block';
}

// Salva a despesa (nova ou editada)
function salvarDespesa() {
    // Obter os valores do formulário
    const id = document.getElementById('despesa-id').value;
    const descricao = document.getElementById('despesa-descricao').value.trim();
    const categoria = document.getElementById('despesa-categoria').value;
    const tipo = document.getElementById('despesa-tipo').value;
    const valorStr = document.getElementById('despesa-valor').value;
    const dataVencimento = document.getElementById('despesa-vencimento').value;
    const status = document.getElementById('despesa-status').value;
    const dataPagamento = document.getElementById('despesa-data-pagamento').value;
    const observacoes = document.getElementById('despesa-observacoes').value.trim();
    
    // Validar campos obrigatórios
    if (!descricao || !categoria || !valorStr || !dataVencimento || !status) {
        mostrarNotificacao("Por favor, preencha todos os campos obrigatórios.", "error");
        return;
    }
    
    // Converte o valor para número
    const valor = converterMoedaParaNumero(valorStr);
    
    // Verifica se o valor é válido
    if (isNaN(valor) || valor <= 0) {
        mostrarNotificacao("Por favor, informe um valor válido.", "error");
        return;
    }
    
    // Preparar objeto de despesa
    const despesa = {
        id: id ? parseInt(id) : null,
        descricao,
        categoria,
        tipo,
        valor,
        dataVencimento,
        status,
        dataPagamento: status === 'pago' ? dataPagamento : null,
        observacoes,
        mes: mesAtual,
        ano: anoAtual
    };
    
    let sucesso = false;
    
    if (id) {
        // Modo edição
        sucesso = atualizarDespesa(despesa);
        if (sucesso) {
            mostrarNotificacao("Despesa atualizada com sucesso!");
        } else {
            mostrarNotificacao("Erro ao atualizar despesa. Tente novamente.", "error");
        }
    } else {
        // Modo adição
        sucesso = adicionarDespesa(despesa);
        if (sucesso) {
            mostrarNotificacao("Despesa adicionada com sucesso!");
        } else {
            mostrarNotificacao("Erro ao adicionar despesa. Tente novamente.", "error");
        }
    }
    
    if (sucesso) {
        // Fechar o modal e recarregar os dados
        modalDespesa.style.display = 'none';
        carregarDadosPeriodo(mesAtual, anoAtual);
    }
}

// Atualiza o dashboard com os totais
function atualizarDashboard() {
    const totais = obterTotaisMes(mesAtual, anoAtual);
    
    document.getElementById('valor-total-mensal').textContent = 
        formatarMoeda(totais.total).replace('R$', '').trim();
    
    document.getElementById('valor-total-pago').textContent = 
        formatarMoeda(totais.pago).replace('R$', '').trim();
    
    document.getElementById('valor-total-pendente').textContent = 
        formatarMoeda(totais.pendente).replace('R$', '').trim();
    
    document.getElementById('valor-total-atrasado').textContent = 
        formatarMoeda(totais.atrasado).replace('R$', '').trim();
}

// Carrega os meses arquivados
function carregarMesesArquivados() {
    const mesesArquivados = obterMesesArquivados();
    const tbody = document.getElementById('arquivados-body');
    tbody.innerHTML = '';
    
    if (mesesArquivados.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="6" class="empty-state">
                Nenhum mês arquivado encontrado.
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }
    
    mesesArquivados.forEach(mes => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${obterNomeMes(mes.mes)}</td>
            <td>${mes.ano}</td>
            <td>${formatarMoeda(parseFloat(mes.total))}</td>
            <td>${mes.quantidade_despesas}</td>
            <td>${formatarData(mes.data_arquivamento)}</td>
            <td class="acoes">
                <button class="btn-acao btn-restaurar" data-mes="${mes.mes}" data-ano="${mes.ano}" title="Restaurar">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="btn-acao btn-ver" data-mes="${mes.mes}" data-ano="${mes.ano}" title="Ver Detalhes">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-acao btn-exportar" data-mes="${mes.mes}" data-ano="${mes.ano}" title="Exportar">
                    <i class="fas fa-file-export"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Adiciona event listeners aos botões de ação
    document.querySelectorAll('.btn-restaurar').forEach(btn => {
        btn.addEventListener('click', function() {
            const mes = parseInt(this.getAttribute('data-mes'));
            const ano = parseInt(this.getAttribute('data-ano'));
            
            document.getElementById('mensagem-confirmar').textContent = 
                `Tem certeza que deseja restaurar o mês de ${obterNomeMes(mes)} de ${ano}?`;
            
            document.getElementById('btn-confirmar-sim').onclick = function() {
                if (restaurarMesArquivado(mes, ano)) {
                    carregarMesesArquivados();
                    if (mes === mesAtual && ano === anoAtual) {
                        carregarDadosPeriodo(mesAtual, anoAtual);
                    }
                    mostrarNotificacao("Mês restaurado com sucesso.");
                }
                modalConfirmar.style.display = 'none';
            };
            
            document.getElementById('btn-confirmar-nao').onclick = function() {
                modalConfirmar.style.display = 'none';
            };
            
            modalConfirmar.style.display = 'block';
        });
    });
    
    document.querySelectorAll('.btn-ver').forEach(btn => {
        btn.addEventListener('click', function() {
            const mes = parseInt(this.getAttribute('data-mes'));
            const ano = parseInt(this.getAttribute('data-ano'));
            
            // Carrega os dados deste mês arquivado
            const despesas = obterDespesasMesArquivado(mes, ano);
            
            // Atualiza os selects para o mês arquivado
            mesSelect.value = mes;
            anoSelect.value = ano;
            
            // Carrega os dados
            mesAtual = mes;
            anoAtual = ano;
            despesasAtuais = despesas;
            
            // Renderiza as despesas
            renderizarDespesas(despesas);
            
            // Atualiza o dashboard (você pode criar uma função específica para meses arquivados)
            // Como os dados já estão no array de despesas, podemos calcular os totais manualmente
            const totais = {
                total: despesas.reduce((total, d) => total + parseFloat(d.valor), 0),
                pago: despesas.filter(d => d.status === 'pago')
                    .reduce((total, d) => total + parseFloat(d.valor), 0),
                pendente: despesas.filter(d => d.status === 'pendente' && !estaVencida(d.data_vencimento))
                    .reduce((total, d) => total + parseFloat(d.valor), 0),
                atrasado: despesas.filter(d => d.status === 'pendente' && estaVencida(d.data_vencimento))
                    .reduce((total, d) => total + parseFloat(d.valor), 0)
            };
            
            document.getElementById('valor-total-mensal').textContent = 
                formatarMoeda(totais.total).replace('R$', '').trim();
            document.getElementById('valor-total-pago').textContent = 
                formatarMoeda(totais.pago).replace('R$', '').trim();
            document.getElementById('valor-total-pendente').textContent = 
                formatarMoeda(totais.pendente).replace('R$', '').trim();
            document.getElementById('valor-total-atrasado').textContent = 
                formatarMoeda(totais.atrasado).replace('R$', '').trim();
            
            // Muda para a tab de despesas
            document.querySelector('.tab-btn[data-tab="despesas-tab"]').click();
            
            mostrarNotificacao(`Visualizando dados arquivados de ${obterNomeMes(mes)} de ${ano}.`);
        });
    });
    
    document.querySelectorAll('.btn-exportar').forEach(btn => {
        btn.addEventListener('click', function() {
            const mes = parseInt(this.getAttribute('data-mes'));
            const ano = parseInt(this.getAttribute('data-ano'));
            
            // Obtém as despesas deste mês arquivado
            const despesas = obterDespesasMesArquivado(mes, ano);
            
            // Exporta para Excel
            const nomeArquivo = exportarExcel(despesas, mes, ano);
            mostrarNotificacao(`Arquivo ${nomeArquivo} exportado com sucesso!`);
        });
    });
}

// Arquiva o mês atual
function arquivarMesAtual() {
    if (arquivarMes(mesAtual, anoAtual)) {
        modalArquivar.style.display = 'none';
        carregarDadosPeriodo(mesAtual, anoAtual);
        carregarMesesArquivados();
        mostrarNotificacao(`Mês de ${obterNomeMes(mesAtual)} de ${anoAtual} arquivado com sucesso.`);
    } else {
        mostrarNotificacao("Erro ao arquivar mês. Verifique se existem despesas a serem arquivadas.", "error");
    }
}

// Aplica filtros nas despesas
function aplicarFiltros() {
    const tipo = filtroTipo.value;
    const status = filtroStatus.value;
    const categoria = filtroCategoria.value;
    
    // Carrega as despesas com os filtros
    const despesasFiltradas = obterDespesasPorPeriodo(mesAtual, anoAtual, {
        tipo, status, categoria
    });
    
    // Atualiza a lista de despesas atuais
    despesasAtuais = despesasFiltradas;
    
    // Renderiza as despesas filtradas
    renderizarDespesas(despesasFiltradas);
    
    mostrarNotificacao("Filtros aplicados com sucesso.");
}