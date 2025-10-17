import React, { useEffect, useRef, useState } from 'react';

// Dichiarazioni TypeScript per Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class StreetViewService {
      getPanorama(
        request: {
          location: { lat: number; lng: number };
          radius: number;
          source: any;
        },
        callback: (data: any, status: any) => void
      ): void;
    }
    
    class StreetViewPanorama {
      constructor(container: HTMLElement, options: any);
    }
    
    enum StreetViewStatus {
      OK = 'OK'
    }
    
    enum StreetViewSource {
      OUTDOOR = 'outdoor'
    }
  }
}

interface StreetViewProps {
  lat?: number;
  lng?: number;
  heading?: number;
  pitch?: number;
  zoom?: number;
  className?: string;
}

const StreetView: React.FC<StreetViewProps> = ({
  lat = 42.557, // Coordinate di Piedelpoggio
  lng = 12.995,
  heading = 0,
  pitch = 0,
  zoom = 1,
  className = "w-full h-96"
}) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      // Verifica se Google Maps è già caricato
      if (window.google && window.google.maps) {
        initializeStreetView();
        return;
      }

      // Carica Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAWbUT1j1h0jzU1UtQlVi6CKxKHKL8iojk&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeStreetView;
      script.onerror = () => {
        setError('Errore nel caricamento di Google Maps');
      };
      document.head.appendChild(script);
    };

    const initializeStreetView = () => {
      if (!streetViewRef.current) return;

      try {
        const streetViewService = new google.maps.StreetViewService();
        
        // Verifica se Street View è disponibile nella posizione
        streetViewService.getPanorama({
          location: { lat, lng },
          radius: 1000, // Raggio di ricerca in metri
          source: google.maps.StreetViewSource.OUTDOOR
        }, (data, status) => {
          if (status === google.maps.StreetViewStatus.OK && data) {
            // Street View disponibile, inizializza il panorama
            const panorama = new google.maps.StreetViewPanorama(streetViewRef.current!, {
              position: data.location?.latLng,
              pov: {
                heading: heading,
                pitch: pitch
              },
              zoom: zoom,
              addressControl: true,
              linksControl: true,
              panControl: true,
              enableCloseButton: false,
              fullscreenControl: true,
              motionTracking: false,
              motionTrackingControl: false
            });

            setIsLoaded(true);
            setError(null);
          } else {
            // Street View non disponibile, mostra messaggio
            setError('Street View non disponibile in questa posizione');
          }
        });
      } catch (err) {
        setError('Errore nell\'inizializzazione di Street View');
        console.error('Street View error:', err);
      }
    };

    loadGoogleMaps();
  }, [lat, lng, heading, pitch, zoom]);

  if (error) {
    return (
      <div className={`${className} bg-gray-100 rounded-2xl flex items-center justify-center`}>
        <div className="text-center p-8">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306a7.962 7.962 0 00-6 0m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v1.306m6 0V7a2 2 0 012 2v4M9 6.306V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4.294a7.962 7.962 0 002.176 5.468"/>
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Street View non disponibile</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-gray-100 rounded-2xl overflow-hidden relative`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento Street View...</p>
          </div>
        </div>
      )}
      <div ref={streetViewRef} className="w-full h-full" />
    </div>
  );
};

export default StreetView;