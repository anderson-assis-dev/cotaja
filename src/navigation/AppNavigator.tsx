import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
import MyOrdersScreen from '../screens/client/MyOrdersScreen';
import ActiveAuctionScreen from '../screens/client/ActiveAuctionScreen';
import RateProviderScreen from '../screens/client/RateProviderScreen';
import CheckoutScreen from '../screens/client/CheckoutScreen';
import PaymentScreen from '../screens/client/PaymentScreen';
import SearchScreen from '../screens/client/SearchScreen';

// Telas do Prestador
import ProviderHomeScreen from '../screens/provider/HomeScreen';
import AvailableDemandsScreen from '../screens/provider/AvailableDemandsScreen';
import SendProposalScreen from '../screens/provider/SendProposalScreen';
import ProviderAuctionScreen from '../screens/provider/ProviderAuctionScreen';
import RateClientScreen from '../screens/provider/RateClientScreen';
import MyServicesScreen from '../screens/provider/MyServicesScreen';

// Telas de Gerenciamento
import ProfileScreen from '../screens/management/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Pilhas de Navegação para as Abas ---
const ClientHomeStack = createNativeStackNavigator();
function ClientHomeStackNavigator() {
  return (
    <ClientHomeStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientHomeStack.Screen name="ClientHomeScreen" component={ClientHomeScreen} />
      <ClientHomeStack.Screen name="CreateOrder" component={CreateOrderScreen} />
    </ClientHomeStack.Navigator>
  );
}

const MyOrdersStack = createNativeStackNavigator();
function MyOrdersStackNavigator() {
  return (
    <MyOrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <MyOrdersStack.Screen name="MyOrders" component={MyOrdersScreen} />
      <MyOrdersStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <MyOrdersStack.Screen name="ActiveAuction" component={ActiveAuctionScreen} />
      <MyOrdersStack.Screen name="RateProvider" component={RateProviderScreen} />
      <MyOrdersStack.Screen name="Checkout" component={CheckoutScreen} />
      <MyOrdersStack.Screen name="Payment" component={PaymentScreen} />
    </MyOrdersStack.Navigator>
  );
}

const MyServicesStack = createNativeStackNavigator();
function MyServicesStackNavigator() {
    return (
        <MyServicesStack.Navigator screenOptions={{ headerShown: false }}>
            <MyServicesStack.Screen name="MyServices" component={MyServicesScreen} />
            <MyServicesStack.Screen name="ProviderAuction" component={ProviderAuctionScreen} />
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

// --- Navegador de Abas do Cliente ---
function ClientTabNavigator() {
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
      <Tab.Screen name="Home" component={ClientHomeStackNavigator} options={{ title: 'Início' }} />
      <Tab.Screen name="MyOrdersTab" component={MyOrdersStackNavigator} options={{ title: 'Meus Pedidos' }}/>
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Buscar' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Perfil' }} />
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
            } else if (route.name === 'AvailableDemandsTab') {
              iconName = 'assignment';
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
        <Tab.Screen name="MyServicesTab" component={MyServicesStackNavigator} options={{ title: 'Meus Serviços' }}/>
        <Tab.Screen name="AvailableDemandsTab" component={AvailableDemandsStackNavigator} options={{ title: 'Demandas' }}/>
        <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Perfil' }}/>
    </Tab.Navigator>
  );
}

// --- Navegador Principal (Stack) ---
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="ProfileSelection"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Telas de Autenticação e Onboarding */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Initial" component={InitialScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />

        {/* Navegadores de Abas (Perfis) */}
        <Stack.Screen name="Client" component={ClientTabNavigator} />
        <Stack.Screen name="Provider" component={ProviderTabNavigator} />

        {/* As telas foram movidas para dentro das suas respectivas pilhas de abas */}

      </Stack.Navigator>
    </NavigationContainer>
  );
} 