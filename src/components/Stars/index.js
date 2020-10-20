import React, { useRef, useEffect } from 'react';
import { utils, Graphics, Container, filters, Application } from 'pixi.js-legacy';
import { randomInt } from 'mathjs';
import './index.css';

function Stars() {
  const sceneRef = useRef();
  const container = useRef();
  const app = useRef();
  const stars = useRef([]);
  const blurFilter = useRef(new filters.BlurFilter(0.5));
  const width = useRef(window.innerWidth);
  const height = useRef(window.innerHeight);

  useEffect(() => {
    utils.skipHello();
    container.current = new Container();

    for (let i = 0; i < 100; i++) {
      const size = randomInt(1, 4);

      const star = new Graphics();
      star.beginFill(0xe6e6e6);
      star.drawCircle(0, randomInt(5, height.current), size);
      star.name = size.toString();
      star.x = randomInt(5, width.current);
      star.endFill();
      star.filters = [blurFilter.current];

      container.current.addChild(star);
      stars.current.push(star);
    }

    function moveStars(delta) {
      for (let i = 0; i < 100; i++) {
        stars.current[i].x += delta * parseInt(stars.current[i].name, 10) * 0.2;
        if (stars.current[i].x > width.current) stars.current[i].x = 0;
      }
    }

    app.current = new Application({ antialias: true });

    sceneRef.current.appendChild(app.current.view);
    app.current.ticker.add(draw);

    app.current.stage = container.current;

    function draw(delta) {
      moveStars(delta);
    }

    return () => {
      container.current.destroy({
        children: true,
        texture: true,
        baseTexture: true
      });
      app.current.destroy();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      app.current.renderer.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <div className="stars" ref={sceneRef}></div>;
}

export default Stars;
