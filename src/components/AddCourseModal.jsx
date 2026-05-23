import { View, Input, Picker, ScrollView, Text } from "@tarojs/components";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { getTimeTable, getAllWeek } from "../service";
import "./AddCourseModal.css";

export default function AddCourseModal({
  visible,
  onClose,
  onConfirm,
  semester,
}) {
  const [addForm, setAddForm] = useState({
    kcmc: "",
    teacher: "",
    startJc: "",
    endJc: "",
    startWeek: "",
    endWeek: "",
    weekDay: "1",
    classroom: "",
  });
  const [errors, setErrors] = useState({});
  const [weekList, setWeekList] = useState([]);
  const [jcOptions, setJcOptions] = useState([]);

  // 当学期变化或弹窗打开时，获取周列表和节次
  useEffect(() => {
    if (visible && semester) {
      Promise.all([getAllWeek(semester), getTimeTable(semester)])
        .then(([weeks, timeTable]) => {
          setWeekList(weeks);
          setJcOptions(timeTable.map((item) => Number(item.jc)));
        })
        .catch((err) => {
          console.error("获取弹窗数据失败", err);
        });
    }
  }, [visible, semester]);

  // 重置表单
  useEffect(() => {
    if (visible) {
      setAddForm({
        kcmc: "",
        teacher: "",
        startJc: "",
        endJc: "",
        startWeek: "",
        endWeek: "",
        weekDay: "1",
        classroom: "",
      });
      setErrors({});
    }
  }, [visible]);

  const weekOptions = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const weekRange = (weekList || []).map((w) => w.toString());

  const handleInputChange = (field, value) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const validateForm = () => {
    const required = ["kcmc", "startJc", "endJc", "startWeek", "endWeek"];
    const newErrors = {};
    let valid = true;
    required.forEach((f) => {
      if (!addForm[f]) {
        newErrors[f] = true;
        valid = false;
      }
    });
    setErrors(newErrors);
    return valid;
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;
    const schedule = {
      kcmc: addForm.kcmc,
      tmc: addForm.teacher || "",
      croommc: addForm.classroom || "",
      xingqi: parseInt(addForm.weekDay),
      djc: [parseInt(addForm.startJc), parseInt(addForm.endJc)],
      zcstr: Array.from(
        {
          length:
            parseInt(addForm.endWeek) - parseInt(addForm.startWeek) + 1,
        },
        (_, i) => parseInt(addForm.startWeek) + i
      ),
    };
    try {
      await onConfirm(schedule);
      // 成功后由父组件关闭弹窗
    } catch (err) {
      // 错误由父组件处理
      throw err;
    }
  };

  if (!visible) return null;

  return (
    <View className="modal-mask" onClick={onClose}>
      <View
        className="modal-container add-course-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <View className="modal-title">添加课程</View>
        <ScrollView scrollY style={{ maxHeight: "70vh" }}>
          <View className="form-group">
            <Text className="form-label">
              课程名称 <Text className="required">*</Text>
            </Text>
            <Input
              placeholder="请输入课程名称"
              value={addForm.kcmc}
              onInput={(e) => handleInputChange("kcmc", e.detail.value)}
              className={`form-input ${errors.kcmc ? "error" : ""}`}
            />
          </View>

          <View className="form-group">
            <Text className="form-label">教师</Text>
            <Input
              placeholder="请输入教师姓名"
              value={addForm.teacher}
              onInput={(e) => handleInputChange("teacher", e.detail.value)}
              className="form-input"
            />
          </View>

          <View className="form-group">
            <Text className="form-label">
              开始节次 <Text className="required">*</Text>
            </Text>
            <Picker
              mode="selector"
              range={jcOptions}
              onChange={(e) =>
                handleInputChange("startJc", jcOptions[e.detail.value])
              }
            >
              <View className={`picker-view ${errors.startJc ? "error" : ""}`}>
                {addForm.startJc ? `第${addForm.startJc}节` : "请选择开始节次"}
              </View>
            </Picker>
          </View>

          <View className="form-group">
            <Text className="form-label">
              结束节次 <Text className="required">*</Text>
            </Text>
            <Picker
              mode="selector"
              range={jcOptions}
              onChange={(e) =>
                handleInputChange("endJc", jcOptions[e.detail.value])
              }
            >
              <View className={`picker-view ${errors.endJc ? "error" : ""}`}>
                {addForm.endJc ? `第${addForm.endJc}节` : "请选择结束节次"}
              </View>
            </Picker>
          </View>

          <View className="form-group">
            <Text className="form-label">星期</Text>
            <Picker
              mode="selector"
              range={weekOptions}
              onChange={(e) =>
                handleInputChange("weekDay", (e.detail.value + 1).toString())
              }
            >
              <View className="picker-view">
                {weekOptions[parseInt(addForm.weekDay) - 1]}
              </View>
            </Picker>
          </View>

          <View className="form-group">
            <Text className="form-label">
              开始周 <Text className="required">*</Text>
            </Text>
            <Picker
              mode="selector"
              range={weekRange}
              onChange={(e) =>
                handleInputChange("startWeek", weekRange[e.detail.value])
              }
            >
              <View
                className={`picker-view ${errors.startWeek ? "error" : ""}`}
              >
                {addForm.startWeek
                  ? `第${addForm.startWeek}周`
                  : "请选择开始周"}
              </View>
            </Picker>
          </View>

          <View className="form-group">
            <Text className="form-label">
              结束周 <Text className="required">*</Text>
            </Text>
            <Picker
              mode="selector"
              range={weekRange}
              onChange={(e) =>
                handleInputChange("endWeek", weekRange[e.detail.value])
              }
            >
              <View className={`picker-view ${errors.endWeek ? "error" : ""}`}>
                {addForm.endWeek ? `第${addForm.endWeek}周` : "请选择结束周"}
              </View>
            </Picker>
          </View>

          <View className="form-group">
            <Text className="form-label">教室</Text>
            <Input
              placeholder="请输入教室"
              value={addForm.classroom}
              onInput={(e) => handleInputChange("classroom", e.detail.value)}
              className="form-input"
            />
          </View>

          <View className="modal-buttons">
            <View className="btn-cancel" onClick={onClose}>
              取消
            </View>
            <View className="btn-confirm" onClick={handleConfirm}>
              确定
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
