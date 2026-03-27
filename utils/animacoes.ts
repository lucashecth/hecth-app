// src/utils/animacoes.ts
export const lancarBolasMikasa = (e: React.MouseEvent<HTMLButtonElement>) => {
  const container = document.body;
  const numBolas = 15;
  const duracao = 1800;
  const originX = e.clientX;
  const originY = e.clientY;

  for (let i = 0; i < numBolas; i++) {
    const ball = document.createElement('img');
    ball.src = '/mikasa-ball.png';
    ball.className = 'fixed pointer-events-none opacity-0 z-50';
    const size = Math.random() * 15 + 15;
    ball.style.width = `${size}px`;
    ball.style.height = `${size}px`;
    ball.style.left = `${originX}px`;
    ball.style.top = `${originY}px`;
    ball.style.transform = 'translate(-50%, -50%) scale(0.1) rotate(0deg)';
    container.appendChild(ball);

    ball.style.transition = `all ${duracao}ms cubic-bezier(0.1, 0.8, 0.3, 1)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const angle = Math.random() * 2 * Math.PI;
        const velocity = Math.random() * 300 + 200;
        const destX = originX + Math.cos(angle) * velocity;
        const destY = originY + Math.sin(angle) * velocity - 80;
        const rotation = Math.random() * 1080 - 540;
        ball.style.left = `${destX}px`;
        ball.style.top = `${destY}px`;
        ball.style.opacity = '1';
        ball.style.transform = `translate(-50%, -50%) scale(1.2) rotate(${rotation}deg)`;
        setTimeout(() => {
          ball.style.opacity = '0';
          ball.style.transform += ' scale(0.8)';
        }, duracao * 0.7);
      });
    });
    setTimeout(() => ball.remove(), duracao);
  }
};