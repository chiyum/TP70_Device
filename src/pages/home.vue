<script setup lang="ts">
import { useTP70Deposit } from "@/composables/TP70Deposit";

const {
  state,
  badgeState,
  onClearData,
  connectSerial,
  onConfirmDeposit,
  onCancelDeposit
} = useTP70Deposit();
</script>

<template>
  <div class="deposit">
    <q-card>
      <div class="deposit-actions">
        <q-btn
          color="primary"
          :disable="state.isConnected"
          label="啟動入鈔機監聽"
          @click="connectSerial"
        />
        <!--        <q-btn color="primary" label="關閉入鈔機" @click="closeConnection" />-->
        <q-btn
          color="primary"
          :disable="!state.isConnected"
          label="確認入鈔"
          @click="onConfirmDeposit"
        />
        <q-btn
          color="primary"
          :disable="!state.isConnected"
          label="退鈔"
          @click="onCancelDeposit"
        />
      </div>
      <div class="deposit-state">
        <h4>入鈔機狀態：</h4>
        <q-badge
          style="font-size: 1rem; padding: 0.5rem 1rem"
          :color="badgeState"
          >{{ state.state }}</q-badge
        >
      </div>
      <div class="deposit-amount">
        <h4>當前等待確認的金額：</h4>
        <p>${{ state.currentPendingAmount }}</p>
        <h4>存入總金額：</h4>
        <p>${{ state.totalAmount }}</p>
      </div>
      <div class="deposit-codes">
        <h4>機器傳入十六進制代碼：</h4>
        <p>
          <q-icon
            name="refresh"
            size="20px"
            style="margin-right: 1rem"
            @click="onClearData"
          />{{ state.receivedData }}
        </p>
      </div>
    </q-card>
  </div>
</template>
