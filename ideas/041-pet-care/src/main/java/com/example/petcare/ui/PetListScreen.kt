package com.example.petcare.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun PetListScreen(viewModel: PetViewModel) {
    val pets by viewModel.pets.collectAsStateWithLifecycle()
    var name by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("우리 가족", style = MaterialTheme.typography.headlineMedium)
        Row {
            OutlinedTextField(value = name, onValueChange = { name = it },
                label = { Text("이름") }, modifier = Modifier.weight(1f))
            Spacer(Modifier.width(8.dp))
            Button(onClick = { viewModel.addPet(name, "dog"); name = "" }) { Text("등록") }
        }
        Spacer(Modifier.height(16.dp))
        LazyColumn {
            items(pets, key = { it.id }) { p ->
                ListItem(headlineContent = { Text(p.name) },
                    supportingContent = { Text(p.species) })
            }
        }
    }
}
