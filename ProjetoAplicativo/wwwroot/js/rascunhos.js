
$(document).on('click', '.delete-instruction', function () {
    if (!confirm('Tem certeza que deseja excluir esta instrução?')) {
        return;
    }

    const instructionId = $(this).data('id');
    const $row = $(this).closest('tr[data-id]');
    const token = $('meta[name="__RequestVerificationToken"]').attr('content');

    $.ajax({
        url: '/Roteiros/DeletaInstrucao',
        type: 'POST',
        data: JSON.stringify({ id: instructionId }),
        contentType: 'application/json',
        headers: {
            'RequestVerificationToken': token
        },
        success: function (response) {
            if (response.success) {
                $row.fadeOut(300, function () {
                    $(this).remove();
                    // Re-number remaining instructions
                    $('.lista-instrucoes tr[data-id] .js-ordem').each(function (index) {
                        $(this).text(index + 1);
                    });
                });
            } else {
                alert('Erro ao excluir: ' + response.message);
            }
        },
        error: function (xhr) {
            alert('Erro: ' + xhr.status + ' - ' + xhr.responseText);
        }
    });
});





















// Handle delete instruction button clicks
$(document).on('click', '.delete-instruction', function () {
    if (!confirm('Tem certeza que deseja excluir esta instrução?')) {
        return;
    }

    const instructionId = $(this).data('id');
    const $row = $(this).closest('tr[data-id]');

    $.ajax({
        url: '/Roteiros/DeletaInstrucao',
        type: 'POST',
        data: {
            id: instructionId,
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        },
        success: function (response) {
            if (response.success) {
                // Remove the row from the table
                $row.remove();

                // Re-number the remaining instructions
                $('.lista-instrucoes tr[data-id] .js-ordem').each(function (index) {
                    $(this).text(index + 1);
                });
            } else {
                alert('Erro ao excluir: ' + response.message);
            }
        },
        error: function () {
            alert('Erro ao conectar com o servidor');
        }
    });
});


//#region -- TESTS
async function checkDuplicate(instrucaoId, personagemId, tipo) { // Call this when a personagem is selected
    const response = await fetch(`/Roteiros/CheckForDuplicates?instrucaoId=${instrucaoId}&personagemId=${personagemId}&tipo=${tipo}`);
    const data = await response.json(); if (data.isDuplicate) { showToastWarning("Este personagem já está vinculado com este tipo de participação."); }
}
//#endregion -- TESTS

//#region MOVE
function moveInstruction(id, direction) {
    const row = $(`tr[data-id="${id}"]`);
    const currentOrder = parseInt(row.find('.js-ordem').text());
    const swapRow = direction === 'up'
        ? row.prev()
        : row.next();

    if (swapRow.length) {
        const swapOrder = parseInt(swapRow.find('.js-ordem').text());

        // Update UI immediately
        row.find('.js-ordem').text(swapOrder);
        swapRow.find('.js-ordem').text(currentOrder);

        // Update backend
        $.post('/Roteiros/ReorderInstructions', {
            cenaId: $('#instrucaoForm input[name="CenaId"]').val(),
            newOrder: {
                [id]: swapOrder,
                [swapRow.data('id')]: currentOrder
            }
        });
    }
}
// Event handlers:
$(document).on('click', '.move-up', function () {
    moveInstruction($(this).data('id'), 'up');
});

$(document).on('click', '.move-down', function () {
    moveInstruction($(this).data('id'), 'down');
});
//#endregion MOVE

//#region PERSONAGEM SUBMIT
function preparePersonagemData() {
    const personagemData = [];
    const mainSelect = $('select[name="personagemIds[]"]').first(); // Only check the first/main select
    if (!mainSelect.length) return personagemData;
    const selectedValue = mainSelect.find('option:selected').val();
    // Handle "All"
    if (selectedValue === "-1") {
        personagemData.push({ name: 'personagemIds[]', value: '-1' });
    }
    // Handle "All except"
    else if (selectedValue === "-2") {
        personagemData.push({ name: 'personagemIds[]', value: '-2' });
        $('select[name="personagemIds[]"]').not(':first').find('option:selected').each(function () {
            const val = $(this).val();
            if (val > 0) personagemData.push({ name: 'personagemIds[]', value: val });
        });
    }
    // Handle normal selection
    else {
        $('select[name="personagemIds[]"] option:selected').each(function () {
            const val = $(this).val();
            if (val > 0) personagemData.push({ name: 'personagemIds[]', value: val });
        });
    }
    return personagemData;
}
//#endregion PERSONAGEM SUBMIT
