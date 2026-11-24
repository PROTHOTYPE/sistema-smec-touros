import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  useWindowDimensions, 
  Platform,
  Linking 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  Layers, 
  FileText, 
  FileSpreadsheet, 
  LayoutGrid, 
  Settings,
  ExternalLink,
  Users,
  LogOut,
  UserCheck
} from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DemandsProvider } from './src/context/DemandsContext';
import { ProfileSimulator } from './src/components/common/ProfileSimulator';
import { GlassCard } from './src/components/common/GlassCard';
import { MuralDemandsScreen } from './src/screens/MuralDemandsScreen';
import { ProtocolScreen } from './src/screens/ProtocolScreen';
import { AnnualReportScreen } from './src/screens/AnnualReportScreen';
import { SectorsOverviewScreen } from './src/screens/SectorsOverviewScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AccessRequestsScreen } from './src/screens/AccessRequestsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { PresentationDeck } from './src/components/presentation/PresentationDeck';
import { TourosEmblem } from './src/components/icons/TourosEmblem';
import { SmecLogo } from './src/components/icons/SmecLogo';
import { SectorId } from './src/types';

type ScreenTab = 'mural' | 'oficios' | 'relatorios' | 'setores' | 'acessos' | 'config';

const isPresentationPath = (): boolean => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const pathname = (window.location.pathname || '').toLowerCase().replace(/\/+$/, '');
  const hash = (window.location.hash || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();
  return (
    pathname === '/apresentacao' ||
    pathname === '/apresentacao.html' ||
    pathname === '/slides' ||
    pathname === '/slides.html' ||
    hash.includes('apresentacao') ||
    hash.includes('slides') ||
    search.includes('apresentacao') ||
    search.includes('slides')
  );
};

const MainAppContent: React.FC = () => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 860;
  const [activeTab, setActiveTab] = useState<ScreenTab>('mural');
  const [showPresentation, setShowPresentation] = useState<boolean>(() => isPresentationPath());
  const {
    setSelectedSectorId,
    setActiveSectorFilter,
    setIsViewingAllSectors,
    currentUser,
    isExecutive,
    isSuperAdmin,
    isRhAdmin,
    isAuthenticated,
    pendingUsersCount,
    logout,
  } = useAuth();

  const canRenderProfileSimulator =
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    currentUser?.systemRole === 'SUPER_ADMIN_TI';

  // Permissões de navegação por perfil
  const canViewProtocol = isRhAdmin || isSuperAdmin || isExecutive;
  const canViewAllSectorsTab = isExecutive || isSuperAdmin || isRhAdmin;
  const canViewConfigTab = isSuperAdmin;
  const canViewAccessRequestsTab = isSuperAdmin;

  // Redirecionamento automático caso mude de perfil para um com menos privilégios
  useEffect(() => {
    if (!canViewProtocol && activeTab === 'oficios') {
      setActiveTab('mural');
    }
    if (!canViewAllSectorsTab && activeTab === 'setores') {
      setActiveTab('mural');
    }
    if (!canViewAccessRequestsTab && activeTab === 'acessos') {
      setActiveTab('mural');
    }
    if (!canViewConfigTab && activeTab === 'config') {
      setActiveTab('mural');
    }
  }, [
    currentUser?.role,
    canViewProtocol,
    canViewAllSectorsTab,
    canViewAccessRequestsTab,
    canViewConfigTab,
    activeTab,
  ]);

  // Bloqueio estrito de zoom acidental (pinça/duplo-toque) e travamento de viewport no Web Mobile
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const viewportContent =
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', viewportContent);

    const styleId = 'smec-mobile-viewport-lock';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        html, body, #root {
          touch-action: pan-y !important;
          overscroll-behavior-y: contain !important;
          -webkit-text-size-adjust: 100%;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const preventMultiTouchZoom = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const preventGestureZoom = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventMultiTouchZoom, { passive: false });
    document.addEventListener('gesturestart', preventGestureZoom, { passive: false });

    const handlePopState = () => {
      setShowPresentation(isPresentationPath());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      document.removeEventListener('touchmove', preventMultiTouchZoom);
      document.removeEventListener('gesturestart', preventGestureZoom);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleOpenPresentation = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.pushState({}, '', '/apresentacao');
    }
    setShowPresentation(true);
  };

  const handleClosePresentation = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    setShowPresentation(false);
  };

  if (showPresentation) {
    return (
      <View style={styles.appContainer}>
        <StatusBar style="light" />
        <PresentationDeck onExit={handleClosePresentation} />
      </View>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <View style={styles.appContainer}>
        <StatusBar style="dark" />
        <AuthScreen onOpenPresentation={handleOpenPresentation} />
      </View>
    );
  }

  const handleNavigateToMuralWithSector = (sectorId: SectorId) => {
    setActiveSectorFilter(sectorId);
    setIsViewingAllSectors(false);
    setActiveTab('mural');
  };

  const handleNavigateToReportWithSector = (sectorId: SectorId) => {
    setSelectedSectorId(sectorId);
    setActiveTab('relatorios');
  };

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'mural':
        return <MuralDemandsScreen />;
      case 'oficios':
        return canViewProtocol ? <ProtocolScreen /> : <MuralDemandsScreen />;
      case 'relatorios':
        return <AnnualReportScreen />;
      case 'setores':
        return canViewAllSectorsTab ? (
          <SectorsOverviewScreen
            onNavigateToMural={handleNavigateToMuralWithSector}
            onNavigateToReport={handleNavigateToReportWithSector}
          />
        ) : (
          <MuralDemandsScreen />
        );
      case 'acessos':
        return canViewAccessRequestsTab ? <AccessRequestsScreen /> : <MuralDemandsScreen />;
      case 'config':
        return canViewConfigTab ? <SettingsScreen /> : <MuralDemandsScreen />;
      default:
        return <MuralDemandsScreen />;
    }
  };

  const logoWidth = isLargeScreen ? 145 : width < 400 ? 86 : 102;
  const logoHeight = isLargeScreen ? 46 : width < 400 ? 30 : 34;

  return (
    <View style={styles.appContainer}>
      <StatusBar style="dark" />

      {/* Barra Superior (Header) - Brand Lockup Moderno */}
      <View style={[styles.topHeader, !isLargeScreen && styles.topHeaderMobile]}>
        {/* Lado Esquerdo: Assinatura Institucional Agrupada (Brand Lockup) */}
        <View style={[styles.brandLockup, !isLargeScreen && styles.brandLockupMobile]}>
          {/* 1. Logo da Prefeitura de Touros */}
          <TourosEmblem width={logoWidth} height={logoHeight} />

          {/* 2. Divisor Vertical Fino */}
          <View style={styles.brandDivider} />

          {/* 3. Logo da SMEC */}
          <SmecLogo width={logoWidth} height={logoHeight} />

          {/* 4. Divisor Vertical Fino + 5. Bloco de Título (Desktop/Tablet) */}
          {isLargeScreen ? (
            <>
              <View style={styles.brandDivider} />
              <View style={styles.titleBlock}>
                <Text style={styles.systemTitle}>Sistema de Gestão Interna</Text>
                <Text style={styles.systemSubtitle}>
                  Secretaria Municipal de Educação e Cultura • Projeto PRISMA
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.titleBlockMobile}>
              <Text style={styles.systemTitleMobile} numberOfLines={1}>Sistema de Gestão Interna</Text>
              <Text style={styles.systemSubtitleMobile} numberOfLines={1}>SMEC • Projeto PRISMA</Text>
            </View>
          )}
        </View>

        {/* Lado Direito do Header: Simulador restrito a __DEV__ + SUPER_ADMIN_TI ou Barra de Sessão Segura em Produção */}
        {isLargeScreen && (
          canRenderProfileSimulator ? (
            <ProfileSimulator headerMode />
          ) : (
            <View style={styles.prodSessionContainer}>
              <View style={styles.prodUserBadge}>
                <UserCheck size={16} color="#1E40AF" />
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.prodUserName} numberOfLines={1}>
                    {currentUser.fullName || currentUser.name}
                  </Text>
                  <Text style={styles.prodUserRole} numberOfLines={1}>
                    {currentUser.jobTitle || currentUser.cargo}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={logout} activeOpacity={0.8} style={styles.prodLogoutBtn}>
                <LogOut size={14} color="#B91C1C" />
                <Text style={styles.prodLogoutText}>Sair</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* No Mobile: Simulador de Perfil restrito a __DEV__ + SUPER_ADMIN_TI ou Barra de Sessão em Produção */}
        {!isLargeScreen && (
          <View style={styles.mobileProfileWrapper}>
            {canRenderProfileSimulator ? (
              <ProfileSimulator compact style={styles.mobileProfileStrip} />
            ) : (
              <View style={[styles.prodSessionContainer, styles.mobileProfileStrip, { justifyContent: 'space-between' }]}>
                <View style={[styles.prodUserBadge, { flex: 1, flexShrink: 1 }]}>
                  <UserCheck size={15} color="#1E40AF" />
                  <View style={{ flex: 1, flexShrink: 1 }}>
                    <Text style={styles.prodUserName} numberOfLines={1}>
                      {currentUser.fullName || currentUser.name}
                    </Text>
                    <Text style={styles.prodUserRole} numberOfLines={1}>
                      {currentUser.jobTitle || currentUser.cargo}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={logout} activeOpacity={0.8} style={styles.prodLogoutBtn}>
                  <LogOut size={14} color="#B91C1C" />
                  <Text style={styles.prodLogoutText}>Sair</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Layout Principal: Sidebar acoplada abaixo do Header no Desktop ou Conteúdo Full no Mobile */}
        <View style={[styles.mainLayout, !isLargeScreen && styles.mainLayoutMobile]}>
          {isLargeScreen && (
            <View style={styles.sidebar}>
              {/* Cabeçalho de Seção Discreto */}
              <Text style={styles.sidebarSectionHeader}>NAVEGAÇÃO DO SETOR</Text>

              {/* Itens de Navegação */}
              <View style={styles.navList}>
                <TouchableOpacity
                  onPress={() => setActiveTab('mural')}
                  style={[styles.navItem, activeTab === 'mural' && styles.navItemActive]}
                >
                  <View
                    style={[
                      styles.navActiveIndicator,
                      activeTab === 'mural' && styles.navActiveIndicatorVisible,
                    ]}
                  />
                  <Layers size={17} color={activeTab === 'mural' ? '#1E40AF' : '#64748B'} />
                  <Text style={[styles.navText, activeTab === 'mural' && styles.navTextActive]}>
                    Mural de Demandas
                  </Text>
                </TouchableOpacity>

                {/* Protocolo de Ofícios: Visível APENAS para RH, TI e Gabinete */}
                {canViewProtocol && (
                  <TouchableOpacity
                    onPress={() => setActiveTab('oficios')}
                    style={[styles.navItem, activeTab === 'oficios' && styles.navItemActive]}
                  >
                    <View
                      style={[
                        styles.navActiveIndicator,
                        activeTab === 'oficios' && styles.navActiveIndicatorVisible,
                      ]}
                    />
                    <FileText size={17} color={activeTab === 'oficios' ? '#1E40AF' : '#64748B'} />
                    <Text style={[styles.navText, activeTab === 'oficios' && styles.navTextActive]}>
                      Protocolo de Ofícios (RH)
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setActiveTab('relatorios')}
                  style={[styles.navItem, activeTab === 'relatorios' && styles.navItemActive]}
                >
                  <View
                    style={[
                      styles.navActiveIndicator,
                      activeTab === 'relatorios' && styles.navActiveIndicatorVisible,
                    ]}
                  />
                  <FileSpreadsheet
                    size={17}
                    color={activeTab === 'relatorios' ? '#1E40AF' : '#64748B'}
                  />
                  <Text
                    style={[styles.navText, activeTab === 'relatorios' && styles.navTextActive]}
                  >
                    Relatório Anual (PDF)
                  </Text>
                </TouchableOpacity>

                {/* Panorama dos Setores: Visível APENAS para Gabinete Executivo e Super Admin TI */}
                {canViewAllSectorsTab && (
                  <TouchableOpacity
                    onPress={() => setActiveTab('setores')}
                    style={[styles.navItem, activeTab === 'setores' && styles.navItemActive]}
                  >
                    <View
                      style={[
                        styles.navActiveIndicator,
                        activeTab === 'setores' && styles.navActiveIndicatorVisible,
                      ]}
                    />
                    <LayoutGrid size={17} color={activeTab === 'setores' ? '#1E40AF' : '#64748B'} />
                    <Text style={[styles.navText, activeTab === 'setores' && styles.navTextActive]}>
                      Panorama dos Setores
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Solicitações de acesso (apenas TI-SMEC) */}
                {canViewAccessRequestsTab && (
                  <TouchableOpacity
                    onPress={() => setActiveTab('acessos')}
                    style={[styles.navItem, activeTab === 'acessos' && styles.navItemActive]}
                  >
                    <View
                      style={[
                        styles.navActiveIndicator,
                        activeTab === 'acessos' && styles.navActiveIndicatorVisible,
                      ]}
                    />
                    <Users size={17} color={activeTab === 'acessos' ? '#1E40AF' : '#64748B'} />
                    <Text
                      style={[
                        styles.navText,
                        { flex: 1 },
                        activeTab === 'acessos' && styles.navTextActive,
                      ]}
                    >
                      Solicitações de Acesso
                    </Text>
                    <View
                      style={[
                        styles.navBadge,
                        pendingUsersCount > 0 ? styles.navBadgePending : styles.navBadgeNeutral,
                      ]}
                    >
                      <Text
                        style={[
                          styles.navBadgeText,
                          pendingUsersCount > 0
                            ? styles.navBadgeTextPending
                            : styles.navBadgeTextNeutral,
                        ]}
                      >
                        [{pendingUsersCount}]
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Apresentação Executiva Keynote: disponível para Gabinete, RH e Super Admin */}
                {canViewAllSectorsTab && (
                  <TouchableOpacity
                    onPress={handleOpenPresentation}
                    style={styles.navItem}
                  >
                    <View style={styles.navActiveIndicator} />
                    <ExternalLink size={17} color="#64748B" />
                    <Text style={styles.navText}>Apresentação Executiva</Text>
                  </TouchableOpacity>
                )}

                {/* Configurações do sistema (apenas TI-SMEC) */}
                {canViewConfigTab && (
                  <TouchableOpacity
                    onPress={() => setActiveTab('config')}
                    style={[styles.navItem, activeTab === 'config' && styles.navItemActive]}
                  >
                    <View
                      style={[
                        styles.navActiveIndicator,
                        activeTab === 'config' && styles.navActiveIndicatorVisible,
                      ]}
                    />
                    <Settings size={17} color={activeTab === 'config' ? '#1E40AF' : '#64748B'} />
                    <Text style={[styles.navText, activeTab === 'config' && styles.navTextActive]}>
                      Configurações & Nuvem
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Espaçador flexível para fixar a assinatura na base */}
              <View style={{ flex: 1, minHeight: 20 }} />

              {/* Assinatura Sutil e Discreta na Sidebar */}
              <View style={styles.sidebarFooter}>
                <TouchableOpacity
                  onPress={handleOpenPresentation}
                  activeOpacity={0.7}
                  style={styles.devCreditLink}
                >
                  <Text style={styles.devCreditText}>
                    Projeto PRISMA • <Text style={styles.devCreditBold}>PROTHOTYPE</Text>
                  </Text>
                  <ExternalLink size={11} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Área Central de Conteúdo */}
          <View style={[styles.screenContentArea, isLargeScreen && styles.screenContentAreaDesktop]}>
            {renderCurrentScreen()}
          </View>
        </View>

        {/* Barra de Navegação Inferior (Mobile) */}
        {!isLargeScreen && (
          <View style={styles.mobileTabBar}>
            <GlassCard padding={4} intensity={80} style={styles.mobileTabGlass}>
              <TouchableOpacity
                onPress={() => setActiveTab('mural')}
                style={[styles.mobileTabItem, activeTab === 'mural' && styles.mobileTabItemActive]}
              >
                <View style={styles.mobileTabIconBox}>
                  <Layers size={18} color={activeTab === 'mural' ? '#1E40AF' : '#64748B'} />
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.mobileTabText, activeTab === 'mural' && styles.mobileTabTextActive]}
                >
                  Mural
                </Text>
              </TouchableOpacity>

              {/* Protocolo de Ofícios: Visível APENAS para RH, TI e Gabinete no Mobile */}
              {canViewProtocol && (
                <TouchableOpacity
                  onPress={() => setActiveTab('oficios')}
                  style={[styles.mobileTabItem, activeTab === 'oficios' && styles.mobileTabItemActive]}
                >
                  <View style={styles.mobileTabIconBox}>
                    <FileText size={18} color={activeTab === 'oficios' ? '#1E40AF' : '#64748B'} />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.mobileTabText,
                      activeTab === 'oficios' && { color: '#1E40AF', fontWeight: '800' },
                    ]}
                  >
                    Ofícios
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setActiveTab('relatorios')}
                style={[styles.mobileTabItem, activeTab === 'relatorios' && styles.mobileTabItemActive]}
              >
                <View style={styles.mobileTabIconBox}>
                  <FileSpreadsheet size={18} color={activeTab === 'relatorios' ? '#15803D' : '#64748B'} />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.mobileTabText,
                    activeTab === 'relatorios' && { color: '#15803D', fontWeight: '800' },
                  ]}
                >
                  Relatório
                </Text>
              </TouchableOpacity>

              {/* Panorama dos Setores no Mobile */}
              {canViewAllSectorsTab && (
                <TouchableOpacity
                  onPress={() => setActiveTab('setores')}
                  style={[styles.mobileTabItem, activeTab === 'setores' && styles.mobileTabItemActive]}
                >
                  <View style={styles.mobileTabIconBox}>
                    <LayoutGrid size={18} color={activeTab === 'setores' ? '#B45309' : '#64748B'} />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.mobileTabText,
                      activeTab === 'setores' && { color: '#B45309', fontWeight: '800' },
                    ]}
                  >
                    Setores
                  </Text>
                </TouchableOpacity>
              )}

              {/* Solicitações de Acesso no Mobile: EXCLUSIVO SUPER_ADMIN_TI */}
              {canViewAccessRequestsTab && (
                <TouchableOpacity
                  onPress={() => setActiveTab('acessos')}
                  style={[styles.mobileTabItem, activeTab === 'acessos' && styles.mobileTabItemActive]}
                >
                  <View style={styles.mobileTabIconBox}>
                    <Users size={18} color={activeTab === 'acessos' ? '#1E40AF' : '#64748B'} />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.mobileTabText, activeTab === 'acessos' && styles.mobileTabTextActive]}
                  >
                    {pendingUsersCount > 0 ? `Acessos (${pendingUsersCount})` : 'Acessos'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Configurações & Nuvem no Mobile: EXCLUSIVO SUPER_ADMIN_TI */}
              {canViewConfigTab && (
                <TouchableOpacity
                  onPress={() => setActiveTab('config')}
                  style={[styles.mobileTabItem, activeTab === 'config' && styles.mobileTabItemActive]}
                >
                  <View style={styles.mobileTabIconBox}>
                    <Settings size={18} color={activeTab === 'config' ? '#1E40AF' : '#64748B'} />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.mobileTabText, activeTab === 'config' && styles.mobileTabTextActive]}
                  >
                    Ajustes
                  </Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DemandsProvider>
        <MainAppContent />
      </DemandsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({
          touchAction: 'pan-y',
          overscrollBehaviorY: 'contain',
        } as any)
      : {}),
  },
  topHeader: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 20,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        } as any)
      : {}),
  },
  topHeaderMobile: {
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'android' ? 28 : 8,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandLockupMobile: {
    flex: 1,
    gap: 8,
    flexShrink: 1,
  },
  brandDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#CBD5E1',
  },
  titleBlock: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  systemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  systemSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  titleBlockMobile: {
    justifyContent: 'center',
    flex: 1,
    flexShrink: 1,
  },
  systemTitleMobile: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  systemSubtitleMobile: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  safeArea: {
    flex: 1,
    minHeight: 0,
  },
  mobileProfileWrapper: {
    paddingHorizontal: 14,
    paddingTop: 10,
    flexShrink: 0,
  },
  mobileProfileStrip: {
    marginBottom: 8,
  },
  prodSessionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  prodUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prodUserName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  prodUserRole: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  prodLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  prodLogoutText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#B91C1C',
  },
  mainLayout: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
  },
  mainLayoutMobile: {
    paddingHorizontal: 12,
    paddingBottom: 86,
  },
  sidebar: {
    width: 256,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
  sidebarSectionHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.7,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  navList: {
    gap: 5,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 10,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  navActiveIndicator: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3.5,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: 'transparent',
  },
  navActiveIndicatorVisible: {
    backgroundColor: '#1E40AF',
  },
  navText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  navTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  navBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  navBadgePending: {
    backgroundColor: '#FEF9E7',
    borderColor: '#FDE68A',
  },
  navBadgeNeutral: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  navBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  navBadgeTextPending: {
    color: '#B45309',
  },
  navBadgeTextNeutral: {
    color: '#64748B',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  sidebarFooterShieldText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  devCreditLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  devCreditText: {
    fontSize: 11,
    color: '#64748B',
  },
  devCreditBold: {
    fontWeight: '800',
    color: '#1E40AF',
  },
  screenContentArea: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
  },
  screenContentAreaDesktop: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  screenMainFlex: {
    flex: 1,
    minHeight: 0,
  },
  internalPageFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 10,
    flexShrink: 0,
  },
  internalPageFooterMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
    gap: 2,
  },
  internalFooterPrimary: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  internalFooterLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  internalFooterSecondary: {
    fontSize: 10.5,
    color: '#64748B',
    textAlign: 'center',
  },
  mobileTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 4,
    zIndex: 30,
  },
  mobileTabGlass: {
    minHeight: 64,
    height: 66,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'nowrap',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)' } as any)
      : {}),
  },
  mobileTabItem: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 12,
    gap: 3,
  },
  mobileTabIconBox: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mobileTabItemActive: {
    backgroundColor: '#EFF6FF',
  },
  mobileTabText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    flexShrink: 0,
  },
  mobileTabTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
});
