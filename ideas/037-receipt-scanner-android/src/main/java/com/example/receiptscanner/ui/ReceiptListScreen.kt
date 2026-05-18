package com.example.receiptscanner.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun ReceiptListScreen(viewModel: ReceiptViewModel) {
    val receipts by viewModel.receipts.collectAsStateWithLifecycle()
    var query by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("영수증 보관함", style = MaterialTheme.typography.headlineMedium)
        OutlinedTextField(value = query, onValueChange = {
            query = it
            viewModel.search(it)
        }, label = { Text("검색") })
        Spacer(Modifier.height(16.dp))
        LazyColumn {
            items(receipts, key = { it.id }) { r ->
                ListItem(headlineContent = { Text("${r.merchant} ${r.amount}원") },
                    supportingContent = { Text(r.date) })
            }
        }
    }
}
