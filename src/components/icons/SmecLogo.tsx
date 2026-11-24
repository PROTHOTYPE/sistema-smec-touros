import React, { useState } from 'react';
import { Image, StyleProp, ImageStyle } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';

interface SmecLogoProps {
  size?: number;
  width?: number;
  height?: number;
  customUri?: string;
  forceSvg?: boolean;
  style?: StyleProp<ImageStyle>;
}

export const SmecLogo: React.FC<SmecLogoProps> = ({ 
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
      const source = customUri ? { uri: customUri } : require('../../../assets/logo-smec.png');
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

  // Fallback Automático: SVG Institucional SMEC (Azul Royal e Ouro)
  return (
    <Svg width={imgWidth} height={imgHeight} viewBox="0 0 120 120" fill="none">
      <Defs>
        <LinearGradient id="smecRoyalGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#2563EB" />
          <Stop offset="50%" stopColor="#1E40AF" />
          <Stop offset="100%" stopColor="#172554" />
        </LinearGradient>
        <LinearGradient id="goldCleanGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="50%" stopColor="#EAB308" />
          <Stop offset="100%" stopColor="#CA8A04" />
        </LinearGradient>
        <LinearGradient id="torchGrad" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor="#EA580C" />
          <Stop offset="60%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#FEF08A" />
        </LinearGradient>
      </Defs>

      {/* Círculo Externo com Borda Ouro e Fundo Azul Translúcido */}
      <Circle cx="60" cy="60" r="54" fill="rgba(30, 64, 175, 0.06)" stroke="url(#smecRoyalGrad)" strokeWidth="2.5" />
      <Circle cx="60" cy="60" r="48" stroke="url(#goldCleanGrad)" strokeWidth="1.2" strokeDasharray="3 3" />

      {/* Livro Aberto (Educação) */}
      <G id="livro-aberto">
        <Path 
          d="M60 76 C50 68, 34 68, 26 73 L26 48 C34 43, 50 43, 60 51 Z" 
          fill="#FFFFFF" 
          stroke="#1E40AF" 
          strokeWidth="1.6" 
        />
        <Path 
          d="M60 76 C70 68, 86 68, 94 73 L94 48 C86 43, 70 43, 60 51 Z" 
          fill="#FFFFFF" 
          stroke="#1E40AF" 
          strokeWidth="1.6" 
        />
        <Path d="M32 54 C38 51, 48 51, 54 56" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M32 60 C38 57, 48 57, 54 62" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M32 66 C38 63, 48 63, 54 68" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />

        <Path d="M66 56 C72 51, 82 51, 88 54" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M66 62 C72 57, 82 57, 88 60" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M66 68 C72 63, 82 63, 88 66" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
      </G>

      {/* Tocha do Conhecimento */}
      <Path 
        d="M60 48 C56 42, 55 33, 60 25 C65 33, 64 42, 60 48 Z" 
        fill="url(#torchGrad)" 
      />
      <Path 
        d="M60 46 C58 42, 58 36, 60 30 C62 36, 62 42, 60 46 Z" 
        fill="#FFFFFF" 
        opacity="0.85" 
      />

      {/* Louros da Cultura em Ouro */}
      <Path d="M38 88 C44 95, 52 98, 60 98 C68 98, 76 95, 82 88" stroke="url(#goldCleanGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="60" cy="88" r="3" fill="#EAB308" />
      <Circle cx="50" cy="87" r="2.5" fill="#EAB308" />
      <Circle cx="70" cy="87" r="2.5" fill="#EAB308" />

      {/* Sigla Oficial SMEC */}
      <SvgText
        x="60"
        y="83"
        fontSize="10"
        fontWeight="bold"
        fill="#1E40AF"
        textAnchor="middle"
        letterSpacing="1"
      >
        SMEC
      </SvgText>
    </Svg>
  );
};
