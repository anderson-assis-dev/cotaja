import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { View, StyleSheet, StatusBar, Alert } from 'react-native';
import { HomeScreenSkeleton, ProviderHomeScreenSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from './navigationRef';
import InAppNotification from '../components/InAppNotification';

import InitialScreen from '../screens/InitialScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ProfileSelectionScreen from '../screens/auth/ProfileSelectionScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';

import ClientHomeScreen from '../screens/client/HomeScreen';
import CreateOrderScreen from '../screens/client/CreateOrderScreen';
import OrderDetailsScreen from '../screens/client/OrderDetailsScreen';
import ActiveAuctionScreen from '../screens/client/ActiveAuctionScreen';
import RateProviderScreen from '../screens/client/RateProviderScreen';
import RateProviderListScreen from '../screens/client/RateProviderListScreen';
import CheckoutScreen from '../screens/client/CheckoutScreen';
import PaymentScreen from '../screens/client/PaymentScreen';
import SearchScreen from '../screens/client/SearchScreen';
import MyOrdersHomeScreen from '../screens/client/MyOrdersHomeScreen';
import AcceptedOrderScreen from '../screens/client/AcceptedOrderScreen';

import ProviderHomeScreen from '../screens/provider/HomeScreen';
import AvailableDemandsScreen from '../screens/provider/AvailableDemandsScreen';
import SendProposalScreen from '../screens/provider/SendProposalScreen';
import AuctionScreen from '../screens/provider/ProviderAuctionScreen';
import RateClientScreen from '../screens/provider/RateClientScreen';
import ProviderVisibilityScreen from '../screens/provider/ProviderVisibilityScreen';
import MyServicesScreen from '../screens/provider/MyServicesScreen';
import ProviderSearchScreen from '../screens/provider/SearchScreen';

import ProfileScreen from '../screens/management/ProfileScreen';
import WalletScreen from '../screens/management/WalletScreen';
import TermsOfUseScreen from '../screens/management/TermsOfUseScreen';
import PrivacyPolicyScreen from '../screens/management/PrivacyPolicyScreen';
import MyDataScreen from '../screens/management/MyDataScreen';
import SecurityScreen from '../screens/management/SecurityScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ClientHomeStack = createNativeStackNavigator();
function ClientHomeStackNavigator({ route }: any) {
  const clientInfo = route?.params?.clientInfo || {};
  const clientId = route?.params?.clientId || null;

  return (
    <ClientHomeStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientHomeStack.Screen
        name="ClientHomeScreen"
        component={ClientHomeScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <ClientHomeStack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <ClientHomeStack.Screen
        name="HomeMyOrders"
        component={MyOrdersHomeScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <ClientHomeStack.Screen
        name="HomeActiveAuction"
        component={ActiveAuctionScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <ClientHomeStack.Screen
        name="HomeCheckout"
        component={CheckoutScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <ClientHomeStack.Screen
        name="HomePayment"
        component={PaymentScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <ClientHomeStack.Screen
        name="HomeAcceptedOrder"
        component={AcceptedOrderScreen}
      />
      <ClientHomeStack.Screen
        name="RateProviderList"
        component={RateProviderListScreen}
      />
      <ClientHomeStack.Screen
        name="RateProvider"
        component={RateProviderScreen}
      />
    </ClientHomeStack.Navigator>
  );
}

const MyOrdersStack = createNativeStackNavigator();
function MyOrdersStackNavigator({ route }: any) {
  const clientInfo = route?.params?.clientInfo || {};
  const clientId = route?.params?.clientId || null;

  return (
    <MyOrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <MyOrdersStack.Screen
        name="MyOrders"
        component={OrderDetailsScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <MyOrdersStack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <MyOrdersStack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <MyOrdersStack.Screen
        name="ActiveAuction"
        component={ActiveAuctionScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <MyOrdersStack.Screen
        name="RateProvider"
        component={RateProviderScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <MyOrdersStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <MyOrdersStack.Screen
        name="Payment"
        component={PaymentScreen}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <MyOrdersStack.Screen
        name="AcceptedOrder"
        component={AcceptedOrderScreen}
      />
    </MyOrdersStack.Navigator>
  );
}

const ProviderHomeStack = createNativeStackNavigator();
function ProviderHomeStackNavigator() {
  return (
    <ProviderHomeStack.Navigator screenOptions={{ headerShown: false }}>
      <ProviderHomeStack.Screen name="ProviderHome" component={ProviderHomeScreen} />
      <ProviderHomeStack.Screen name="ProviderVisibility" component={ProviderVisibilityScreen} />
    </ProviderHomeStack.Navigator>
  );
}

const MyServicesStack = createNativeStackNavigator();
function MyServicesStackNavigator({ route }: any) {
    const initialRouteName = route?.params?.initialScreen || 'MyServices';

    return (
        <MyServicesStack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={initialRouteName}
        >
            <MyServicesStack.Screen name="MyServices" component={MyServicesScreen} />
            <MyServicesStack.Screen name="ProviderAuction" component={AuctionScreen} />
            <MyServicesStack.Screen name="RateClient" component={RateClientScreen} />
            <MyServicesStack.Screen name="AcceptedOrder" component={AcceptedOrderScreen} />
        </MyServicesStack.Navigator>
    );
}

const AvailableDemandsStack = createNativeStackNavigator();
function AvailableDemandsStackNavigator() {
    return (
        <AvailableDemandsStack.Navigator screenOptions={{ headerShown: false }}>
            <AvailableDemandsStack.Screen name="AvailableDemands" component={AvailableDemandsScreen} />
            <AvailableDemandsStack.Screen name="SendProposal" component={SendProposalScreen} />
        </AvailableDemandsStack.Navigator>
    );
}

const AuctionsStack = createNativeStackNavigator();
function AuctionsStackNavigator() {
    return (
        <AuctionsStack.Navigator screenOptions={{ headerShown: false }}>
            <AuctionsStack.Screen name="ProviderAuction" component={AuctionScreen} />
            <AuctionsStack.Screen name="SendProposal" component={SendProposalScreen} />
        </AuctionsStack.Navigator>
    );
}

const SearchStack = createNativeStackNavigator();
function SearchStackNavigator() {
    return (
        <SearchStack.Navigator screenOptions={{ headerShown: false }}>
            <SearchStack.Screen name="ProviderSearch" component={ProviderSearchScreen} />
            <SearchStack.Screen name="ProviderAuction" component={AuctionScreen} />
            <SearchStack.Screen name="SendProposal" component={SendProposalScreen} />
        </SearchStack.Navigator>
    );
}

function ClientTabNavigator({ route }: any) {
  const clientInfo = route?.params?.clientInfo || {};
  const clientId = route?.params?.clientId || null;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: string;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'MyOrdersTab') {
            iconName = focused ? 'list-alt' : 'list-alt';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person';
          } else {
            iconName = 'circle';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Home"
        component={ClientHomeStackNavigator}
        options={{ title: 'Início' }}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <Tab.Screen
        name="MyOrdersTab"
        component={MyOrdersStackNavigator}
        options={{ title: 'Meus Pedidos' }}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{ title: 'Buscar' }}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
        initialParams={{
          userType: 'client',
          clientId: clientId,
          clientInfo: clientInfo
        }}
      />
    </Tab.Navigator>
  );
}

function ProviderTabNavigator() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
            let iconName: string;
            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'MyServicesTab') {
              iconName = 'build';
            } else if (route.name === 'SearchTab') {
              iconName = 'search';
            } else if (route.name === 'AuctionsTab') {
              iconName = 'gavel';
            } else if (route.name === 'ProfileTab') {
              iconName = 'person';
            } else {
                iconName = 'circle';
            }
            return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: 'gray',
        })}
    >
        <Tab.Screen name="Home" component={ProviderHomeStackNavigator} options={{ title: 'Início' }} />
        <Tab.Screen
            name="MyServicesTab"
            component={MyServicesStackNavigator}
            options={{ title: 'Serviços' }}
            initialParams={{ initialScreen: 'MyServices' }}
        />
        <Tab.Screen name="SearchTab" component={SearchStackNavigator} options={{ title: 'Buscar' }}/>
        <Tab.Screen name="AuctionsTab" component={AuctionsStackNavigator} options={{ title: 'Leilões' }}/>
        <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Perfil' }}/>
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading, isInitializing } = useAuth();
  const [currentRouteName, setCurrentRouteName] = useState<string>('');
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [cachedProfileType, setCachedProfileType] = useState<string | null>(null);

  const checkOnboardingStatus = async () => {
    try {
      console.log('🔍 Verificando status do onboarding...');
      const completed = await AsyncStorage.getItem('onboarding_completed');
      console.log('📱 Valor lido do AsyncStorage:', completed);

      const isCompleted = completed === 'true';
      console.log('✅ Onboarding completado:', isCompleted);

      setOnboardingCompleted(isCompleted);
    } catch (error) {
      console.error('❌ Erro ao verificar status do onboarding:', error);
      setOnboardingCompleted(false);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
    AsyncStorage.getItem('user').then(saved => {
      if (saved) {
        try { setCachedProfileType(JSON.parse(saved).profile_type); } catch {}
      }
    });
  }, []);

  useEffect(() => {
    if (!isInitializing) {
      checkOnboardingStatus();
    }
  }, [user, isInitializing]);

  const getActiveRouteName = (state: any): string => {
    const route = state.routes[state.index];
    if (route.state) {
      return getActiveRouteName(route.state);
    }
    return route.name;
  };

  const onNavigationStateChange = (state: any) => {
    if (state) {
      const routeName = getActiveRouteName(state);
      setCurrentRouteName(routeName);
    }
  };

  const darkContentScreens = [
    'AvailableDemands', 'ProviderSearch', 'SendProposal',
  ];
  const isDarkStatus = darkContentScreens.includes(currentRouteName);

  if (isInitializing || onboardingCompleted === null) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#4f46e5" translucent={false} />
        {cachedProfileType === 'provider' ? <ProviderHomeScreenSkeleton /> : <HomeScreenSkeleton />}
      </>
    );
  }

  return (
    <InAppNotification>
      <StatusBar
        barStyle={isDarkStatus ? "dark-content" : "light-content"}
        backgroundColor={isDarkStatus ? "#f3f4f6" : "#4f46e5"}
        translucent={false}
      />
      <NavigationContainer ref={navigationRef} onStateChange={onNavigationStateChange}>
        <Stack.Navigator
        initialRouteName={
          !onboardingCompleted ? 'Onboarding'
          : !user ? 'Splash'
          : !user.profile_type ? 'ProfileSelection'
          : user.profile_type === 'client' ? 'Client'
          : 'Provider'
        }
        screenOptions={{
          headerShown: false,
        }}
      >
        {!onboardingCompleted && (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Initial" component={InitialScreen} />
            <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          </>
        )}
        {!user && onboardingCompleted && (
          <>

            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Initial" component={InitialScreen} />
            <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          </>
        )}
        {user && !user.profile_type && (
          <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />
        )}
        {user && user.profile_type === 'client' && (
          <Stack.Screen name="Client" component={ClientTabNavigator} />
        )}
        {user && user.profile_type === 'client' && (
          <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
        )}
        {user && user.profile_type === 'client' && (
          <Stack.Screen name="MyData" component={MyDataScreen} options={{ headerShown: false }} />
        )}
        {user && user.profile_type === 'client' && (
          <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
        )}
        {user && user.profile_type === 'provider' && (
          <Stack.Screen name="Provider" component={ProviderTabNavigator} />
        )}
        {user && user.profile_type === 'provider' && (
          <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
        )}
        {user && user.profile_type === 'provider' && (
          <Stack.Screen name="MyData" component={MyDataScreen} options={{ headerShown: false }} />
        )}
        {user && user.profile_type === 'provider' && (
          <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
        )}
        {user && (
          <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} options={{ headerShown: false }} />
        )}
        {user && (
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </InAppNotification>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});