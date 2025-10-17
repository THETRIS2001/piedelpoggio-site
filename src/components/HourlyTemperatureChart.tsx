import React from 'react';

interface TemperatureData {
  time: string;
  temperature: number;
  isPast: boolean;
}

interface HourlyTemperatureChartProps {
  data: TemperatureData[];
  currentTime: string;
}

const HourlyTemperatureChart: React.FC<HourlyTemperatureChartProps> = ({ data, currentTime }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
        <h3 className="text-black text-sm font-medium mb-4">Temperatura Oraria</h3>
        <div className="text-white/70 text-xs">Dati non disponibili</div>
      </div>
    );
  }

  // Trova i valori min e max per scalare il grafico
  const temperatures = data.map(d => d.temperature);
  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);
  const tempRange = maxTemp - minTemp || 1;

  // Calcola la posizione dell'ora corrente
  const currentHour = new Date(currentTime).getHours();
  const currentIndex = data.findIndex(d => {
    const dataHour = new Date(d.time).getHours();
    return dataHour === currentHour;
  });

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
      <h3 className="text-black text-sm font-medium mb-6">Temperatura Oraria</h3>
      
      <div className="relative w-full h-20 mb-4">
        {/* Container del grafico */}
        <div className="relative w-full h-full flex items-end justify-between px-2">

          
          {/* Canvas per la linea di connessione */}
          <canvas
            ref={(canvas) => {
              if (canvas && data.length > 0) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  // Imposta le dimensioni del canvas
                  const rect = canvas.getBoundingClientRect();
                  canvas.width = rect.width * window.devicePixelRatio;
                  canvas.height = rect.height * window.devicePixelRatio;
                  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                  
                  // Pulisci il canvas
                  ctx.clearRect(0, 0, rect.width, rect.height);
                  
                  // Crea il gradiente
                  const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
                  gradient.addColorStop(0, '#9CA3AF');
                  gradient.addColorStop(0.5, '#60A5FA');
                  gradient.addColorStop(1, '#3B82F6');
                  
                  // Imposta lo stile della linea
                  ctx.strokeStyle = gradient;
                  ctx.lineWidth = 2;
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  
                  // Disegna la linea
                  ctx.beginPath();
                  data.forEach((point, index) => {
                    const x = ((index + 0.5) / data.length) * rect.width;
                    const height = ((point.temperature - minTemp) / tempRange) * 60;
                    const y = rect.height - height - 6; // Posizione del centro del pallino
                    
                    if (index === 0) {
                      ctx.moveTo(x, y);
                    } else {
                      ctx.lineTo(x, y);
                    }
                  });
                  ctx.stroke();
                }
              }
            }}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          />
          
          {data.map((point, index) => {
            const height = ((point.temperature - minTemp) / tempRange) * 60; // 60px max height
            
            return (
              <div key={index} className="relative flex flex-col items-center" style={{ width: `${100 / data.length}%`, zIndex: 2 }}>
                {/* Temperatura sopra il punto */}
                <div className="text-xs text-gray-600 mb-1 font-medium">
                  {Math.round(point.temperature)}°
                </div>
                
                {/* Punto del grafico */}
                <div 
                  className="w-3 h-3 rounded-full border-2 border-white bg-blue-400 shadow-sm"
                  style={{ 
                    marginBottom: `${height}px`,
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* Linea di base del grafico */}
        <div className="absolute bottom-0 left-2 right-2 h-px bg-white/20" />
      </div>
      
      {/* Etichette orarie */}
      <div className="flex justify-between text-xs text-gray-600 px-2">
        {data.map((d, index) => (
          <div key={index} className="text-center" style={{ width: `${100 / data.length}%` }}>
            {index % 3 === 0 ? (
              <span className="font-medium">
                {new Date(d.time).getHours().toString().padStart(2, '0')}:00
              </span>
            ) : (
              <span className="opacity-50">·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HourlyTemperatureChart;