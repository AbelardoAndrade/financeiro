// Função para formatar valores em moeda brasileira (BRL)
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Função para formatar valores de input de moeda
function formatarInputMoeda(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = (parseFloat(valor) / 100).toFixed(2);
    
    if (isNaN(valor)) {
        valor = '0.00';
    }
    
    input.value = valor.replace('.', ',');
}

// Função para converter valor em string de moeda para número
function converterMoedaParaNumero(valor) {
    if (!valor) return 0;
    
    return parseFloat(valor.replace(/\./g, '').replace(',', '.'));
}

// Formatar data para exibição (DD/MM/YYYY)
function formatarData(dataStr) {
    if (!dataStr) return '';
    
    const data = new Date(dataStr);
    return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

// Converte data de exibição (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
function converterDataParaISO(dataStr) {
    if (!dataStr) return '';
    
    const partes = dataStr.split('/');
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

// Obter nome do mês com base no número
function obterNomeMes(numeroMes) {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 
        'Maio', 'Junho', 'Julho', 'Agosto', 
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return meses[numeroMes - 1];
}

// Verificar se uma data está vencida
function estaVencida(dataStr) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataVencimento = new Date(dataStr);
    dataVencimento.setHours(0, 0, 0, 0);
    
    return dataVencimento < hoje;
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.getElementById('notificacao');
    const mensagemEl = document.getElementById('mensagem-notificacao');
    
    mensagemEl.textContent = mensagem;
    
    // Adiciona classes de cor baseado no tipo
    notificacao.className = 'notificacao';
    if (tipo === 'error') {
        notificacao.style.backgroundColor = 'var(--danger-color)';
    } else if (tipo === 'warning') {
        notificacao.style.backgroundColor = 'var(--warning-color)';
        notificacao.style.color = '#333';
    } else {
        notificacao.style.backgroundColor = 'var(--success-color)';
    }
    
    // Mostra a notificação
    notificacao.classList.add('show');
    
    // Oculta depois de 3 segundos
    setTimeout(() => {
        notificacao.classList.remove('show');
    }, 3000);
}

// Exportar para Excel
function exportarExcel(despesas, mes, ano) {
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Transformar dados para o formato esperado pelo Excel
    const dados = despesas.map(d => ({
        'Descrição': d.descricao,
        'Categoria': d.categoria,
        'Tipo': d.tipo === 'mensal' ? 'Mensal' : 'Avulso',
        'Valor (R$)': parseFloat(d.valor).toFixed(2).replace('.', ','),
        'Data de Vencimento': formatarData(d.data_vencimento),
        'Status': d.status === 'pago' ? 'Pago' : (estaVencida(d.data_vencimento) ? 'Atrasado' : 'Pendente'),
        'Data de Pagamento': d.data_pagamento ? formatarData(d.data_pagamento) : '',
        'Observações': d.observacoes || ''
    }));
    
    // Calcular totais
    const totais = {
        total: despesas.reduce((total, d) => total + parseFloat(d.valor), 0),
        pago: despesas.filter(d => d.status === 'pago')
            .reduce((total, d) => total + parseFloat(d.valor), 0),
        pendente: despesas.filter(d => d.status === 'pendente' && !estaVencida(d.data_vencimento))
            .reduce((total, d) => total + parseFloat(d.valor), 0),
        atrasado: despesas.filter(d => d.status === 'pendente' && estaVencida(d.data_vencimento))
            .reduce((total, d) => total + parseFloat(d.valor), 0)
    };
    
    // Adicionar linha em branco e linha de resumo
    dados.push({});
    dados.push({
        'Descrição': 'RESUMO:',
        'Valor (R$)': ''
    });
    dados.push({
        'Descrição': 'Total',
        'Valor (R$)': formatarMoeda(totais.total).replace('R$', '').trim()
    });
    dados.push({
        'Descrição': 'Total Pago',
        'Valor (R$)': formatarMoeda(totais.pago).replace('R$', '').trim()
    });
    dados.push({
        'Descrição': 'Total Pendente',
        'Valor (R$)': formatarMoeda(totais.pendente).replace('R$', '').trim()
    });
    dados.push({
        'Descrição': 'Total Atrasado',
        'Valor (R$)': formatarMoeda(totais.atrasado).replace('R$', '').trim()
    });
    
    // Criar worksheet
    const ws = XLSX.utils.json_to_sheet(dados);
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, `Despesas`);
    
    // Nome do arquivo
    const nomeArquivo = `Despesas_${obterNomeMes(mes)}_${ano}.xlsx`;
    
    // Exportar
    XLSX.writeFile(wb, nomeArquivo);
    
    return nomeArquivo;
}