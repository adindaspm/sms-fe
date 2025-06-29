document.addEventListener('DOMContentLoaded', () => {
  const programSelect = document.getElementById('program');
  const outputSelect = document.getElementById('output');
  if (!programSelect || !outputSelect) return;

  const oldProgramId = programSelect.dataset.oldProgram;
  const oldOutputId = outputSelect.dataset.oldOutput;

  async function loadOutputs(programId, selectedOutputId = null) {
    outputSelect.innerHTML = '<option value="" class="bg-primary-100 text-white" >Loading...</option>';

    if (!programId) {
      outputSelect.innerHTML = '<option value="" class="bg-primary-100 text-white" >Pilih Output</option>';      
      return;
    }

    try {
      const res = await fetch(`/operator/programs/${programId}/outputs`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const outputs = await res.json();
      outputSelect.innerHTML = '<option value="" class="bg-primary-100 text-white" >Pilih Output</option>';
      outputs.forEach(output => {
        const option = document.createElement('option');
        option.value = output.id;
        option.textContent = output.name;
        option.className = 'bg-primary-100 text-white';
        if (String(output.id) === String(selectedOutputId)) {
          option.selected = true;
        }
        outputSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Gagal load output:', err);
      outputSelect.innerHTML = '<option value="" class="bg-primary-100 text-white" >Gagal memuat output</option>';
    }
  }

  programSelect.addEventListener('change', function () {
    loadOutputs(this.value);
  });

  if (oldProgramId) {
    loadOutputs(oldProgramId, oldOutputId);
  }
});
