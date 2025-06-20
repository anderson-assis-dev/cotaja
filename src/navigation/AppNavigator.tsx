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
      <Tab.Screen name="Home" component={ClientHomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="MyOrdersTab" component={MyOrdersScreen} options={{ title: 'Meus Pedidos' }}/>
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
        <Tab.Screen name="MyServicesTab" component={MyServicesScreen} options={{ title: 'Meus Serviços' }}/>
        <Tab.Screen name="AvailableDemandsTab" component={AvailableDemandsScreen} options={{ title: 'Demandas' }}/>
        <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Perfil' }}/>
    </Tab.Navigator>
  );
}

// --- Navegador Principal (Stack) ---
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
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

        {/* Telas que abrem sobre as abas (sem a barra de abas) */}
        <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="ActiveAuction" component={ActiveAuctionScreen} />
        <Stack.Screen name="RateProvider" component={RateProviderScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="SendProposal" component={SendProposalScreen} />
        <Stack.Screen name="ProviderAuction" component={ProviderAuctionScreen} />
        <Stack.Screen name="RateClient" component={RateClientScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
} 