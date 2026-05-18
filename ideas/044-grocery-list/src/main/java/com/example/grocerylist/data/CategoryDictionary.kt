package com.example.grocerylist.data

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CategoryDictionary @Inject constructor() {
    private val map = mapOf(
        "우유" to "유제품", "치즈" to "유제품", "요거트" to "유제품", "버터" to "유제품",
        "계란" to "유제품",
        "사과" to "과일", "바나나" to "과일", "딸기" to "과일",
        "양파" to "채소", "감자" to "채소", "당근" to "채소", "오이" to "채소",
        "닭" to "정육", "돼지" to "정육", "소" to "정육",
        "쌀" to "곡물", "라면" to "가공식품", "식빵" to "가공식품",
        "휴지" to "생활용품", "세제" to "생활용품"
    )

    fun categorize(name: String): String {
        val match = map.entries.firstOrNull { name.contains(it.key) }
        return match?.value ?: "기타"
    }
}
