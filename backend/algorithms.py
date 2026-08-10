
from typing import List, Dict, Any, Union


def insertion_sort_by_field(students: List[Dict[str, Any]], field: str = "age") -> List[Dict[str, Any]]:
    
    n = len(students)
    for i in range(1, n):
        key_item = students[i]
        key_value = key_item.get(field)
        j = i - 1
        
        # Shift elements of students[0..i-1] that are greater than key_value to one position ahead
        while j >= 0 and students[j].get(field) > key_value:
            students[j + 1] = students[j]
            j -= 1
            
        students[j + 1] = key_item
        
    return students


def binary_search_by_name(sorted_by_name_list: List[Dict[str, Any]], name: str) -> Union[Dict[str, Any], int]:
    
    low = 0
    high = len(sorted_by_name_list) - 1
    
    while low <= high:
        mid = low + (high - low) // 2
        current_name = sorted_by_name_list[mid].get("name", "")
        
        if current_name == name:
            return sorted_by_name_list[mid]
        elif current_name < name:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1


def format_roster_report(students: List[Dict[str, Any]]) -> str:
    
    report_lines = []
    for student in students:
        age = student.get("age", 0)
        name = student.get("name", "")
        email = student.get("email", "")
        line = f"[Age {age}] {name} <{email}>"
        report_lines.append(line)
        
    return "\n".join(report_lines)


def count_students_meeting_min_age(students: List[Dict[str, Any]], min_age: int) -> int:
   
    meeting_count = 0
    for student in students:
        student_age = student.get("age", 0)
        if student_age >= min_age:
            meeting_count += 1
            
    return meeting_count
