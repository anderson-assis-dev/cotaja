import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

// Telas do Prestador
import ProviderHomeScreen from '../screens/provider/HomeScreen';
import AvailableDemandsScreen from '../screens/provider/AvailableDemandsScreen';
import SendProposalScreen from '../screens/provider/SendProposalScreen';
import ProviderAuctionScreen from '../screens/provider/ProviderAuctionScreen';
import RateClientScreen from '../screens/provider/RateClientScreen';

// Telas de Gerenciamento
import ProfileScreen from '../screens/management/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Initial"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Initial" component={InitialScreen} />
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />

        {/* Rotas do Cliente */}
        <Stack.Screen name="ClientHome" component={ClientHomeScreen} />
        <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        <Stack.Screen name="ActiveAuction" component={ActiveAuctionScreen} />
        <Stack.Screen name="RateProvider" component={RateProviderScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />

        {/* Rotas do Prestador */}
        <Stack.Screen name="ProviderHome" component={ProviderHomeScreen} />
        <Stack.Screen name="AvailableDemands" component={AvailableDemandsScreen} />
        <Stack.Screen name="SendProposal" component={SendProposalScreen} />
        <Stack.Screen name="ProviderAuction" component={ProviderAuctionScreen} />
        <Stack.Screen name="RateClient" component={RateClientScreen} />

        {/* Rotas de Gerenciamento */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 