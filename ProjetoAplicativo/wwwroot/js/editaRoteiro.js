// FILE: EditaRoteiro.js

//#region -- STATE

let stateModo = 'idle'; let stateReferenceRowId = 0;

function setFormState(modo, referenceRowId) {
    const currentModo = stateModo; const currentRowId = stateReferenceRowId;
    const referenceRow = $(`tr[data-id="${referenceRowId}"]`);
    if (currentModo == 'edit' && currentRowId != referenceRowId) { $(`tr[data-id="${currentRowId}"]`).show(); }
    $('.form-container').remove(); $('#formFeedback').empty();
    if (modo !== 'idle') {
        const formContainer = $('<tr class="form-container"><td colspan="3"></td></tr>');
        const clonedTemplate = $('#formTemplate').html();
        formContainer.find('td').append(clonedTemplate);
        if (modo == 'create') { $('#showForm').hide(); } else { $('#showForm').show(); }
        if (modo == 'create') { $('.tabela').append(formContainer); }
        if (modo == 'above') { referenceRow.before(formContainer); }
        if (modo == 'below') { referenceRow.after(formContainer); }
        if (modo == 'edit') { referenceRow.after(formContainer); referenceRow.hide(); }
        if (modo == 'edit') { $('#dynamicPersonagemContainer').html($('#personagemSelectTemplate').html()); } else { resetToSingleSelect(); }
        initPersonagemHandlers(); initMentions();
        $('html, body').animate({ scrollTop: formContainer.offset().top - 300 }, 1000);
        $('#cancelaForm').off('click').on('click', function () { setFormState('idle', 0); });
    } else { $('#showForm').show(); }
    updateFormState(modo, referenceRowId);
}

function updateFormState(newModo, newReferenceRowId) {
    stateModo = newModo; stateReferenceRowId = newReferenceRowId;
    $('#formState').attr("data-modo", newModo); $('#formState').attr("data-rowid", newReferenceRowId);
}

function setSuccess(response) {
    if (!response.success) { console.error("Server error:", response.error); return; }
    const responseRow = $(response.html); $('.form-container').before(responseRow);
    responseRow.addClass('updated-row').delay(1000).queue(function () { $(this).removeClass('updated-row').dequeue(); });
    $('html, body').animate({ scrollTop: responseRow.offset().top - 300 }, 500);
}

//#endregion -- STATE


//#region -- MENTION

function initMentions() {
    $('#textoInstrucao').atwho({
        at: '@', displayTpl: '<li>${nome}</li>', insertTpl: '@[${id}|${nome}]', searchKey: 'Nome', data: [] //tentar remover searchKey
    });
    $.get(`/Roteiros/GetPersonagensForMentions?cenaId=${currentCenaId}`, function (personagens) {
        //  console.log("Personagem data:", personagens); //Inspect property names here
        $('#textoInstrucao').atwho('load', '@', personagens);
    });
}

//#endregion -- MENTION


//#region -- ALERTS

function feedbackMessage(status, message) {
    if (status == 'create') { var classe = `alert-success`; var texto = `instrução ${message} criada com sucesso`; }
    else if (status == 'above' || status === 'below') { var classe = `alert-success`; var texto = `instrução ${message} inserida com sucesso`; }
    else if (status == 'edit') { var classe = `alert-success`; var texto = `instrução ${message} atualizada com sucesso`; }
    else { var classe = `alert-danger`; var texto = `Erro: ${message}` }
    $('#formFeedback').html(`<div class="alert ${classe} alert-success">${texto}</div>`).hide().fadeIn(300).delay(2000).fadeOut(1000);
}

//#endregion -- ALERTS 


//#region -- PERSONAGEM SELECT 

function resetToSingleSelect() { $('#dynamicPersonagemContainer').empty().append($('#personagemSelectTemplate').html()); $('#addPersonagem').show(); }

function initPersonagemHandlers() {
    $('#addPersonagem').click(addPersonagemSelect);
    function addPersonagemSelect() { if ($('[name="personagemIds[]"]').length < 10) { $('#dynamicPersonagemContainer').append($('#personagemSelectTemplate').html()); } }
    $('#dynamicPersonagemContainer').on('click', '.remove-personagem', function () { removePersonagemSelect(this); });
    function removePersonagemSelect(button) { if ($('[name="personagemIds[]"]').length > 1) { $(button).closest('.personagem-select-group').remove(); } }
    $('#dynamicPersonagemContainer').on('change', '.personagem-select', function () {
        const selectedValue = $(this).val();
        if (selectedValue === "-1") { $('#addPersonagem').hide(); $('.personagem-select-group').not($(this).closest('.personagem-select-group')).remove(); }
        else if (selectedValue === "-2") { $('#addPersonagem').show(); if ($('.personagem-select-group').length === 1) { addPersonagemSelect(); } }
        else { $('#addPersonagem').toggle($('.personagem-select-group').length < 10); }
    });
}

//#endregion -- PERSONAGEM SELECT 


//#region -- CREATE 

document.getElementById('showForm').addEventListener('click', function () {
    setFormState('create', 0);
    $('#instrucaoForm').off('submit');
    $('#instrucaoForm').on('submit', function (e) {
        e.preventDefault();
        const formData = $(this).serializeArray();
        $.ajax({
            url: '/Roteiros/CreateInstrucao', type: 'POST', data: $.param(formData), headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() },
            success: function (response) {
                setSuccess(response); $('#instrucaoForm')[0].reset();
                resetToSingleSelect(); $('.tabela').append($('.form-container'));
                feedbackMessage('create', '');
            }, error: function (xhr) { feedbackMessage(`erro`, `${xhr.responseJSON?.title || xhr.statusText}`); }
        });
    });
});

//#endregion -- CREATE


//#region -- EDIT

$(document).on('click', '.edit-instruction', function () {
    const id = $(this).data('id');
    $.get(`/Roteiros/GetInstrucao/${id}`, function (dados) {
        setFormState('edit', id);
        $('#instrucaoForm input[name="CenaId"]').val(dados.cenaId);
        $('#instrucaoForm select[name="TipoDeInstrucao"]').val(dados.tipo);
        $('#instrucaoForm textarea[name="Texto"]').val(dados.texto);
        $('#instrucaoForm').append(`<input type="hidden" name="Id" value="${dados.id}">`);
        $('#instrucaoForm').append(`<input type="hidden" name="OrdemCronologica" value="${dados.ordem}">`);
        $('#instrucaoForm').attr('data-edit-mode', 'true').attr('data-instruction-id', id); //REVER
        if (dados.instrucoesPersonagens) {
            $('#dynamicPersonagemContainer').empty();
            if (dados.instrucoesPersonagens.some(ins => ins.showAll)) {
                $('#dynamicPersonagemContainer').append($('#personagemSelectTemplate').html());
                $('[name="personagemIds[]"]').first().val('-1'); $('#addPersonagem').hide();
            } else if (dados.instrucoesPersonagens.some(ins => ins.showAllExcept)) {
                $('#dynamicPersonagemContainer').append($('#personagemSelectTemplate').html());
                $('[name="personagemIds[]"]').first().val('-2');
                const exceptions = dados.instrucoesPersonagens.filter(ins => ins.showAllExcept && ins.personagemId).map(ins => ins.personagemId);
                exceptions.forEach((personagemId, index) => {
                    if (index < 9) { $('#dynamicPersonagemContainer').append($('#personagemSelectTemplate').html()); $(`[name="personagemIds[]"]`).eq(index + 1).val(personagemId); }
                }); $('#addPersonagem').toggle(exceptions.length < 9);
            } else if (dados.personagemIds && dados.personagemIds.length > 0) {
                dados.personagemIds.forEach((personagemId, index) => {
                    if (index < 10) { $('#dynamicPersonagemContainer').append($('#personagemSelectTemplate').html()); $(`[name="personagemIds[]"]`).eq(index).val(personagemId); }
                }); $('#addPersonagem').toggle(dados.personagemIds.filter(id => id > 0).length < 10);
            }
        }
        $('#instrucaoForm').off('submit').on('submit', function (e) {
            e.preventDefault();
            const formData = $(this).serializeArray();
            $.ajax({
                url: '/Roteiros/EditInstrucao', type: 'POST', data: $.param(formData), headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() },
                success: function (response) {
                    $(`tr[data-id="${id}"]`).remove(); setSuccess(response); setFormState('idle', 0); feedbackMessage('edit', `${dados.ordem}`);
                }, error: function (xhr) { feedbackMessage(`erro`, `${xhr.responseJSON?.title || xhr.statusText}`); }
            });
        });
    });
});

//#endregion -- EDIT


//#region -- INSERT

$(document).on('click', '.insert-above, .insert-below', function () {
    const referenceId = $(this).data('id');
    const position = $(this).hasClass('insert-above') ? 'above' : 'below';
    const referenceRow = $(`tr[data-id="${referenceId}"]`);
    const referenceOrder = parseInt(referenceRow.find('.js-ordem').text());
    const dados = { ordem: getOrdem() };
    function getOrdem() { if (position === 'above') { return referenceOrder } else { return referenceOrder + 1 } }
    setFormState(position, referenceId);
    const hiddenFields = `<input type="hidden" name="referenceId" value="${referenceId}"><input type="hidden" name="insertPosition" value="${position}"><input type="hidden" name="OrdemCronologica" value="${position === 'above' ? referenceOrder : referenceOrder + 1}">`;//REVER
    const clonedForm = $('#instrucaoForm'); clonedForm.append(hiddenFields);
    $(clonedForm).off('submit').on('submit', function (e) {
        e.preventDefault();
        const formData = $(this).serializeArray();
        $.ajax({
            url: '/Roteiros/InsertInstrucao', type: 'POST', data: $.param(formData), headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() },
            success: function (response) {
                setSuccess(response); setFormState('idle', 0); updateOrderNumbers(); feedbackMessage(position, `${dados.ordem}`);
            }, error: function (xhr) { feedbackMessage(`erro`, `${xhr.responseJSON?.title || xhr.statusText}`); }
        });
    });
});

function updateOrderNumbers() {
    let currentOrder = 1;
    $('tbody tr[data-id]').each(function () {
        const $row = $(this); if ($row.hasClass('form-container')) return;
        $row.find('.js-ordem').text(currentOrder); $row.attr('data-ordem', currentOrder); currentOrder++;
    });
}

//#endregion -- INSERT


//#region -- DELETE


$(document).on('click', '.delete-instruction', function () {
    if (!confirm('Tem certeza que deseja excluir esta instrução?')) return;

    const $row = $(this).closest('tr');
    const deletedOrder = parseInt($row.find('.js-ordem').text()); // Get the numeric order value
    const instructionId = $(this).data('id');
    const token = $('meta[name="__RequestVerificationToken"]').attr('content');

    $.ajax({
        url: '/Roteiros/DeletaInstrucao',
        type: 'POST',
        data: JSON.stringify({ id: instructionId }),
        contentType: 'application/json',
        headers: { 'RequestVerificationToken': token },
        success: function (response) {
            if (response.success) {
                $row.fadeOut(300, function () {
                    $(this).remove();

                    // EXACTLY mirror server behavior:
                    // 1. Find all instructions with higher order numbers
                    $('.lista-instrucoes tr').each(function () {
                        const $ordem = $(this).find('.js-ordem');
                        const currentOrder = parseInt($ordem.text());

                        // 2. Only decrement those with order > deletedOrder
                        if (currentOrder > deletedOrder) {
                            $ordem.text(currentOrder - 1);
                        }
                    });
                });
            } else {
                alert('Erro ao excluir: ' + response.message);
            }
        },
        error: function (xhr) {
            alert('Erro: ' + xhr.responseText);
        }
    });
});

//#endregion -- DELETE


//#region -- MOVE

// Move Up handler
$(document).on('click', '.move-up', function () {
    const instructionId = $(this).data('id');
    moveInstruction(instructionId, 'up');
});

// Move Down handler
$(document).on('click', '.move-down', function () {
    const instructionId = $(this).data('id');
    moveInstruction(instructionId, 'down');
});

function moveInstruction(instructionId, direction) {
    const token = $('meta[name="__RequestVerificationToken"]').attr('content');
    const $row = $(`tr[data-id="${instructionId}"]`);
    const currentOrder = parseInt($row.find('.js-ordem').text());

    // Prevent moving beyond limits
    if ((direction === 'up' && currentOrder <= 1) ||
        (direction === 'down' && currentOrder >= $('.lista-instrucoes tr').length)) {
        return;
    }

    $.ajax({
        url: `/Roteiros/MoveInstruction${direction === 'up' ? 'Up' : 'Down'}`,
        type: 'POST',
        data: JSON.stringify({ id: instructionId }),
        contentType: 'application/json',
        headers: { 'RequestVerificationToken': token },
        success: function (response) {
            if (response.success) {
                // Update client-side display
                const $targetRow = $(`tr[data-id="${response.swappedId}"]`);

                // Swap the order numbers
                $row.find('.js-ordem').text(response.newOrder);
                $targetRow.find('.js-ordem').text(response.swappedOrder);

                // Reorder DOM elements if needed
                if (direction === 'up') {
                    $row.insertBefore($targetRow);
                } else {
                    $row.insertAfter($targetRow);
                }
                $row.add($targetRow).addClass('updated-row').delay(1000).queue(function () { $(this).removeClass('updated-row').dequeue(); });

            } else {
                alert('Erro ao mover: ' + response.message);
            }
        },
        error: function (xhr) {
            alert('Erro: ' + xhr.responseText);
        }
    });
}

//#endregion -- MOVE
