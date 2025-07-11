import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import InitialScreen from '../screens/InitialScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ProfileSelectionScreen from '../screens/auth/ProfileSelectionScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import SplashScreen from '../screens/auth/SplashScreen';

// Telas do Cliente
import ClientHomeScreen from '../screens/client/HomeScreen';
import CreateOrderScreen from '../screens/client/CreateOrderScreen';
import OrderDetailsScreen from '../screens/client/OrderDetailsScreen';
import ActiveAuctionScreen from '../screens/client/ActiveAuctionScreen';
import RateProviderScreen from '../screens/client/RateProviderScreen';
import CheckoutScreen from '../screens/client/CheckoutScreen';
import PaymentScreen from '../screens/client/PaymentScreen';
import SearchScreen from '../screens/client/SearchScreen';

// Telas do Prestador
import ProviderHomeScreen from '../screens/provider/HomeScreen';
import AvailableDemandsScreen from '../screens/provider/AvailableDemandsScreen';
import SendProposalScreen from '../screens/provider/SendProposalScreen';
import AuctionScreen from '../screens/provider/ProviderAuctionScreen';
import RateClientScreen from '../screens/provider/RateClientScreen';
import MyServicesScreen from '../screens/provider/MyServicesScreen';
import ProviderSearchScreen from '../screens/provider/SearchScreen';

// Telas de Gerenciamento
import ProfileScreen from '../screens/management/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Pilhas de Navegação para as Abas ---
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
        component={ActiveAuctionScreen} 
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
    </MyOrdersStack.Navigator>
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

// --- Navegador de Abas do Cliente ---
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

// --- Navegador de Abas do Prestador ---
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
        <Tab.Screen name="Home" component={ProviderHomeScreen} options={{ title: 'Início' }} />
        <Tab.Screen 
            name="MyServicesTab" 
            component={MyServicesStackNavigator} 
            options={{ title: 'Meus Serviços' }}
            initialParams={{ initialScreen: 'MyServices' }}
        />
        <Tab.Screen name="SearchTab" component={SearchStackNavigator} options={{ title: 'Buscar' }}/>
        <Tab.Screen name="AuctionsTab" component={AuctionsStackNavigator} options={{ title: 'Leilões' }}/>
        <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Perfil' }}/>
    </Tab.Navigator>
  );
}

// --- Navegador Principal (Stack) ---
export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={
          !user ? 'Splash'
          : !user.profile_type ? 'ProfileSelection'
          : user.profile_type === 'client' ? 'Client'
          : 'Provider'
        }
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user && (
          <>
            {/* Telas de Autenticação e Onboarding */}
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Initial" component={InitialScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
        {user && !user.profile_type && (
          <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />
        )}
        {user && user.profile_type === 'client' && (
          <Stack.Screen name="Client" component={ClientTabNavigator} />
        )}
        {user && user.profile_type === 'provider' && (
          <Stack.Screen name="Provider" component={ProviderTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 