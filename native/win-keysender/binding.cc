#include <node_api.h>
#include <windows.h>
#include <cstdio>

namespace {

napi_value ThrowLastError(napi_env env) {
  DWORD error = GetLastError();
  char message[96];
  _snprintf_s(message, sizeof(message), _TRUNCATE, "SendInput failed with error %lu", error);
  napi_throw_error(env, nullptr, message);
  return nullptr;
}

napi_value SendKey(napi_env env, WORD virtualKey) {
  INPUT inputs[2] = {};

  inputs[0].type = INPUT_KEYBOARD;
  inputs[0].ki.wVk = virtualKey;
  inputs[0].ki.dwFlags = KEYEVENTF_EXTENDEDKEY;

  inputs[1].type = INPUT_KEYBOARD;
  inputs[1].ki.wVk = virtualKey;
  inputs[1].ki.dwFlags = KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP;

  if (SendInput(2, inputs, sizeof(INPUT)) != 2) {
    return ThrowLastError(env);
  }

  napi_value result;
  napi_get_undefined(env, &result);
  return result;
}

napi_value SendLeft(napi_env env, napi_callback_info) {
  return SendKey(env, VK_LEFT);
}

napi_value SendRight(napi_env env, napi_callback_info) {
  return SendKey(env, VK_RIGHT);
}

napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor descriptors[] = {
    {"sendLeft", nullptr, SendLeft, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"sendRight", nullptr, SendRight, nullptr, nullptr, nullptr, napi_default, nullptr}
  };

  napi_define_properties(env, exports, 2, descriptors);
  return exports;
}

} // namespace

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
