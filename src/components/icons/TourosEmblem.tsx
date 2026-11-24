import React, { useState } from 'react';
import { Image, StyleProp, ImageStyle } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';

interface TourosEmblemProps {
  size?: number;
  width?: number;
  height?: number;
  customUri?: string;
  forceSvg?: boolean;
  style?: StyleProp<ImageStyle>;
}

export const TourosEmblem: React.FC<TourosEmblemProps> = ({ 
  size = 64, 
  width,
  height,
  customUri,
  forceSvg = false,
  style,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imgWidth = width || size;
  const imgHeight = height || size;

  if (!forceSvg && !imageFailed) {
    try {
      const source = customUri ? { uri: customUri } : require('../../../assets/logo-prefeitura.png');
      return (
        <Image 
          source={source} 
          style={[
            { 
              width: imgWidth, 
              height: imgHeight, 
              resizeMode: 'contain',
              backgroundColor: 'transparent',
            },
            style
          ]}
          onError={() => setImageFailed(true)}
        />
      );
    } catch {
      // Fallback para SVG se require falhar
    }
  }

  // Fallback Automático: SVG Institucional Touros (Azul Royal e Ouro)
  return (
    <Svg width={imgWidth} height={imgHeight} viewBox="0 0 120 130" fill="none">
      <Defs>
        <LinearGradient id="crownGradGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="50%" stopColor="#EAB308" />
          <Stop offset="100%" stopColor="#CA8A04" />
        </LinearGradient>
        <LinearGradient id="royalSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#38BDF8" />
          <Stop offset="50%" stopColor="#1E40AF" />
          <Stop offset="100%" stopColor="#1E3A8A" />
        </LinearGradient>
        <LinearGradient id="royalSeaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1D4ED8" />
          <Stop offset="100%" stopColor="#172554" />
        </LinearGradient>
        <LinearGradient id="farolGradClean" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="50%" stopColor="#F1F5F9" />
          <Stop offset="100%" stopColor="#CBD5E1" />
        </LinearGradient>
        <LinearGradient id="bannerGradRoyal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1E40AF" />
          <Stop offset="100%" stopColor="#172554" />
        </LinearGradient>
      </Defs>

      {/* Coroa Mural em Ouro */}
      <G id="coroa-mural">
        <Path d="M36 22 L40 12 L48 12 L50 20 L58 12 L62 12 L64 20 L72 12 L80 12 L84 22 Z" fill="url(#crownGradGold)" stroke="#A16207" strokeWidth="1" />
        <Rect x="42" y="14" width="3" height="4" fill="#713F12" rx="1" />
        <Rect x="58.5" y="14" width="3" height="4" fill="#713F12" rx="1" />
        <Rect x="75" y="14" width="3" height="4" fill="#713F12" rx="1" />
        <Path d="M35 21 L85 21 L82 26 L38 26 Z" fill="url(#crownGradGold)" stroke="#A16207" strokeWidth="0.8" />
      </G>

      {/* Ramo de Carnaúba */}
      <Path d="M22 65 C22 45, 30 30, 36 28 C34 35, 30 50, 32 75 C26 70, 23 68, 22 65 Z" fill="#15803D" opacity="0.95" />
      <Path d="M98 65 C98 45, 90 30, 84 28 C86 35, 90 50, 88 75 C94 70, 97 68, 98 65 Z" fill="#15803D" opacity="0.95" />

      {/* Escudo Heráldico */}
      <Path 
        d="M32 26 H88 V75 C88 95, 60 108, 60 108 C60 108, 32 95, 32 75 Z" 
        fill="url(#royalSkyGrad)" 
        stroke="#EAB308" 
        strokeWidth="2.5" 
      />

      {/* Mar e Ondas de Touros */}
      <Path 
        d="M32 68 C40 64, 50 72, 60 67 C70 63, 80 71, 88 67 V75 C88 95, 60 108, 60 108 C60 108, 32 95, 32 75 Z" 
        fill="url(#royalSeaGrad)" 
      />
      <Path d="M33 69 Q46 63 60 68 Q74 63 87 68" stroke="#E0F2FE" strokeWidth="1.5" fill="none" opacity="0.85" />
      <Path d="M35 77 Q48 72 60 76 Q72 71 85 76" stroke="#BAE6FD" strokeWidth="1.2" fill="none" opacity="0.75" />

      {/* Sol Nascente */}
      <Circle cx="60" cy="52" r="14" fill="#FDE047" opacity="0.9" />
      <Circle cx="60" cy="52" r="10" fill="#EAB308" />

      {/* Farol do Calcanhar */}
      <Path d="M57 42 L63 42 L64 78 L56 78 Z" fill="url(#farolGradClean)" stroke="#1E293B" strokeWidth="0.8" />
      <Rect x="56.8" y="47" width="6.4" height="4" fill="#0F172A" />
      <Rect x="56.5" y="56" width="7" height="4.5" fill="#0F172A" />
      <Rect x="56.2" y="66" width="7.6" height="5" fill="#0F172A" />
      <Path d="M56 42 L64 42 L62 37 L58 37 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="0.5" />
      <Circle cx="60" cy="39" r="1.5" fill="#FEF08A" />
      <Path d="M60 38 L40 33 L41 36 Z" fill="#FEF08A" opacity="0.8" />
      <Path d="M60 38 L80 33 L79 36 Z" fill="#FEF08A" opacity="0.8" />

      {/* Marco de Touros (1501) */}
      <Path d="M42 58 L44 58 L44 72 L42 72 Z" fill="#FFFFFF" stroke="#475569" strokeWidth="0.6" />
      <Path d="M41 61 L45 61" stroke="#FFFFFF" strokeWidth="1" />
      <Path d="M43 57 L43 63" stroke="#FFFFFF" strokeWidth="1" />

      {/* Faixa Inferior */}
      <Path 
        d="M20 108 L34 104 L60 112 L86 104 L100 108 L94 116 L86 112 L60 120 L34 112 L26 116 Z" 
        fill="url(#bannerGradRoyal)" 
        stroke="#EAB308" 
        strokeWidth="1.2" 
      />
      
      <SvgText
        x="60"
        y="117"
        fontSize="6.2"
        fontWeight="bold"
        fill="#FFFFFF"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        TOUROS • 1835
      </SvgText>
    </Svg>
  );
};
