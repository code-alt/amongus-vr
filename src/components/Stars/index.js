import { useRef, useEffect } from 'react';
import { randomInt } from 'mathjs';
import './index.css';

function createStar(xMax, yMax) {
  const size = randomInt(1, 4);

  const star = {
    x: randomInt(5, xMax),
    y: randomInt(5, yMax),
    name: size.toString(),
    size,
  };

  return star;
}

function drawStar(context, star) {
  context.beginPath();
  context.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
  context.shadowColor = '#e6e6e6';
  context.shadowBlur = 4;
  context.fillStyle = '#e6e6e6';
  context.fill();
}

const Stars = (props) => {
  const canvasRef = useRef();
  const context = useRef();
  const stars = useRef();
  const start = useRef(Date.now());

  useEffect(() => {
    const handleResize = () => {
      const { innerWidth, innerHeight } = window;
      context.current = canvasRef.current.getContext('2d');
      canvasRef.current.width = innerWidth;
      canvasRef.current.height = innerHeight;

      stars.current = [];

      for (let i = 0; i < 100; i++) {
        const star = createStar(innerWidth, innerHeight);

        stars.current.push(star);

        drawStar(context.current, star);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    let animation;

    const animate = () => {
      const { innerWidth, innerHeight } = window;
      animation = requestAnimationFrame(animate);

      const time = Date.now();
      const delta = (start.current - time) * -0.08;
      start.current = time;

      context.current.clearRect(0, 0, innerWidth, innerHeight);

      for (let i = 0; i < 100; i++) {
        stars.current[i].x += delta * parseInt(stars.current[i].name, 10) * 0.2;
        if (stars.current[i].x > innerWidth) stars.current[i] = createStar(0, innerHeight);

        drawStar(context.current, stars.current[i]);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animation);
    };
  }, []);

  return (
    <canvas
      aria-hidden
      className="stars"
      ref={canvasRef}
      {...props}
    />
  );
};

export default Stars;
