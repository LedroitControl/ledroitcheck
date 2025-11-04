// Minimal modal system to request user confirmation when needed

export function openModal({ title = 'Confirmación', content = '', okText = 'Aceptar', cancelText = 'Cancelar' } = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <h3>${title}</h3>
      <div class="modal-body">${content}</div>
      <div class="modal-footer">
        <button class="btn secondary" id="btnCancel">${cancelText}</button>
        <button class="btn" id="btnOk">${okText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  setTimeout(() => backdrop.classList.add('show'), 20);

  return new Promise(resolve => {
    const dispose = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 140); };
    backdrop.querySelector('#btnCancel').addEventListener('click', () => { dispose(); resolve(false); });
    backdrop.querySelector('#btnOk').addEventListener('click', () => { dispose(); resolve(true); });
  });
}