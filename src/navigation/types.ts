import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AppStackParamList = {
  Login: undefined;
  Map: undefined;
  Profile: undefined;
};

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;
