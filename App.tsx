import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { demoReaders, demoWorks, findReaders, searchWorks, type Reader, type Work, type WorkType } from "./src/catalog";
import { LIBRARY_STORAGE_KEY, toggleLibraryEntry } from "./src/library";
import { colors } from "./src/theme";

type Tab = "home" | "search" | "library" | "profile";

const workTypes: Array<"الكل" | WorkType> = ["الكل", "Manga", "Manhwa", "Novel", "Comics", "Book", "Light Novel", "Web Novel"];

const workTypeLabels: Record<string, string> = {
  Manga: "مانجا",
  Manhwa: "مانهوا",
  Novel: "رواية",
  Comics: "كوميكس",
  Book: "كتاب",
  "Light Novel": "لايت نوفل",
  "Web Novel": "ويب نوفل"
};

function FeatherMark({ size = 28 }: { size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.35 }]}>
      <Text style={[styles.markText, { fontSize: size * 0.58 }]}>✦</Text>
    </View>
  );
}

function Score({ value }: { value: number }) {
  return (
    <View style={styles.scoreRow}>
      <Ionicons color={colors.gold} name="star" size={13} />
      <Text style={styles.scoreText}>{value.toFixed(1)}</Text>
    </View>
  );
}

function Cover({ work, size = "card" }: { work: Work; size?: "card" | "row" | "hero" }) {
  const style = size === "hero" ? styles.heroCover : size === "row" ? styles.rowCover : styles.cover;
  return <Image accessibilityLabel={`غلاف ${work.title}`} source={{ uri: work.cover }} style={style} />;
}

function TypePill({ type }: { type: WorkType }) {
  return (
    <View style={styles.typePill}>
      <Text style={styles.typePillText}>{workTypeLabels[type]}</Text>
    </View>
  );
}

function ReaderAvatar({ reader, large = false }: { reader: Reader; large?: boolean }) {
  const label = reader.name.trim().charAt(0) || "ل";
  return (
    <View style={[styles.readerAvatar, large && styles.readerAvatarLarge]}>
      {reader.avatar ? <Image source={{ uri: reader.avatar }} style={styles.avatarImage} /> : <Text style={[styles.readerAvatarText, large && styles.readerAvatarTextLarge]}>{label}</Text>}
    </View>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<(typeof workTypes)[number]>("الكل");
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [readers, setReaders] = useState<Reader[]>(demoReaders);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LIBRARY_STORAGE_KEY)
      .then((saved) => setLibraryIds(saved ? JSON.parse(saved) : ["one-piece", "berserk"]))
      .catch(() => setLibraryIds(["one-piece", "berserk"]));
  }, []);

  const searchedWorks = useMemo(() => {
    const results = searchWorks(demoWorks, query);
    return selectedType === "الكل" ? results : results.filter((work) => work.type === selectedType);
  }, [query, selectedType]);

  const readerResults = useMemo(() => findReaders(readers, query), [query, readers]);
  const libraryWorks = demoWorks.filter((work) => libraryIds.includes(work.id));

  async function toggleWork(workId: string) {
    const next = toggleLibraryEntry(libraryIds, workId);
    setLibraryIds(next);
    await AsyncStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(next));
    await Haptics.selectionAsync();
  }

  async function toggleReader(readerId: string) {
    const next = readers.map((reader) => reader.id === readerId ? { ...reader, following: !reader.following } : reader);
    setReaders(next);
    setSelectedReader(next.find((reader) => reader.id === readerId) ?? null);
    await Haptics.selectionAsync();
  }

  function WorkItem({ work, horizontal = false }: { work: Work; horizontal?: boolean }) {
    const saved = libraryIds.includes(work.id);
    return (
      <Pressable onPress={() => setSelectedWork(work)} style={horizontal ? styles.horizontalWork : styles.workRow}>
        <Cover work={work} size={horizontal ? "card" : "row"} />
        <View style={horizontal ? styles.horizontalWorkBody : styles.workRowBody}>
          <TypePill type={work.type} />
          <Text numberOfLines={horizontal ? 2 : 1} style={horizontal ? styles.cardTitle : styles.rowTitle}>{work.title}</Text>
          <Text numberOfLines={1} style={styles.meta}>{work.author}</Text>
          <Score value={work.score} />
        </View>
        {!horizontal && (
          <Pressable accessibilityLabel={saved ? "إزالة من مكتبتي" : "إضافة إلى مكتبتي"} hitSlop={10} onPress={(event) => { event.stopPropagation(); toggleWork(work.id); }} style={[styles.addButton, saved && styles.addButtonSaved]}>
            <Ionicons color={saved ? colors.bg : colors.text} name={saved ? "checkmark" : "add"} size={20} />
          </Pressable>
        )}
      </Pressable>
    );
  }

  function HomeScreen() {
    const featured = demoWorks[0];
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.eyebrow}>مساء القراءة</Text>
            <Text style={styles.homeTitle}>عالمك في <Text style={styles.accentText}>Lorefy</Text></Text>
          </View>
          <Pressable accessibilityLabel="الإشعارات" style={styles.iconButton}>
            <Ionicons color={colors.text} name="notifications-outline" size={21} />
          </Pressable>
        </View>

        <Pressable onPress={() => setSelectedWork(featured)} style={styles.featured}>
          <Cover work={featured} size="hero" />
          <View style={styles.featuredBody}>
            <View style={styles.featuredLabel}><Ionicons color={colors.gold} name="sparkles" size={13} /><Text style={styles.featuredLabelText}>اختيار اليوم</Text></View>
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredText} numberOfLines={2}>{featured.synopsis}</Text>
            <View style={styles.featuredFooter}><Score value={featured.score} /><Text style={styles.continueText}>فتح العمل</Text></View>
          </View>
        </Pressable>

        <SectionHeader action="عرض الكل" title="تابع القراءة" />
        <ScrollView contentContainerStyle={styles.horizontalList} horizontal showsHorizontalScrollIndicator={false}>
          {demoWorks.slice(0, 5).map((work) => <WorkItem horizontal key={work.id} work={work} />)}
        </ScrollView>

        <SectionHeader action="استكشف" title="الأكثر تداولاً" />
        {demoWorks.slice(2, 5).map((work) => <WorkItem key={work.id} work={work} />)}
      </ScrollView>
    );
  }

  function SearchScreen() {
    return (
      <View style={styles.screenFill}>
        <View style={styles.searchHeader}>
          <Text style={styles.screenTitle}>بحث</Text>
          <View style={styles.searchBox}>
            <Ionicons color={colors.muted} name="search" size={19} />
            <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setQuery} placeholder="ابحث بالعنوان، المؤلف أو @المستخدم" placeholderTextColor={colors.muted} style={styles.searchInput} value={query} />
            {query.length > 0 && <Pressable onPress={() => setQuery("")}><Ionicons color={colors.muted} name="close-circle" size={18} /></Pressable>}
          </View>
          <ScrollView contentContainerStyle={styles.chips} horizontal showsHorizontalScrollIndicator={false}>
            {workTypes.map((type) => (
              <Pressable key={type} onPress={() => setSelectedType(type)} style={[styles.chip, selectedType === type && styles.chipActive]}>
                <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>{type === "الكل" ? type : workTypeLabels[type]}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.searchResults} showsVerticalScrollIndicator={false}>
          {query.trim().length >= 2 && readerResults.length > 0 && (
            <View style={styles.readerSearchSection}>
              <View style={styles.readerSearchHeading}><Text style={styles.sectionTitle}>حسابات القراء</Text><Text style={styles.resultCount}>{readerResults.length} نتائج</Text></View>
              {readerResults.map((reader) => (
                <Pressable key={reader.id} onPress={() => setSelectedReader(reader)} style={styles.readerRow}>
                  <ReaderAvatar reader={reader} />
                  <View style={styles.readerRowCopy}><Text style={styles.readerName}>{reader.name}</Text><Text style={styles.readerHandle}>@{reader.username}</Text></View>
                  <View style={[styles.followState, reader.following && styles.followStateOn]}><Text style={[styles.followStateText, reader.following && styles.followStateTextOn]}>{reader.following ? "تتابعه" : "حساب عام"}</Text></View>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.resultsHeading}><Text style={styles.sectionTitle}>الأعمال</Text><Text style={styles.resultCount}>{searchedWorks.length} نتيجة</Text></View>
          {searchedWorks.length === 0 ? <EmptyState icon="search" title="لا توجد نتائج" text="جرّب عنواناً أو اسماً مختلفاً." /> : searchedWorks.map((work) => <WorkItem key={work.id} work={work} />)}
        </ScrollView>
      </View>
    );
  }

  function LibraryScreen() {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pageTop}><Text style={styles.screenTitle}>مكتبتي</Text><Text style={styles.pageSubtitle}>{libraryWorks.length} أعمال محفوظة</Text></View>
        {libraryWorks.length ? libraryWorks.map((work) => <WorkItem key={work.id} work={work} />) : <EmptyState icon="book-outline" title="مكتبتك هادئة الآن" text="أضف أي عمل من البحث لتجده هنا." />}
      </ScrollView>
    );
  }

  function ProfileScreen() {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHero}>
          <FeatherMark size={72} />
          <Text style={styles.profileName}>قارئ Lorefy</Text>
          <Text style={styles.profileHandle}>@lorefy_reader</Text>
          <Text style={styles.profileBio}>رتّب مكتبتك، قيّم الشخصيات، وشارك قصصك في مكان واحد.</Text>
          <View style={styles.profileStats}>
            <Stat label="مكتبة" value={String(libraryWorks.length)} />
            <Stat label="مراجعات" value="0" />
            <Stat label="متابعون" value="0" />
          </View>
        </View>
        <SectionHeader action="تعديل" title="المفضلة" />
        <ScrollView contentContainerStyle={styles.horizontalList} horizontal showsHorizontalScrollIndicator={false}>
          {(libraryWorks.length ? libraryWorks : demoWorks.slice(0, 4)).map((work) => <WorkItem horizontal key={work.id} work={work} />)}
        </ScrollView>
        <View style={styles.settingsCard}>
          <Setting icon="moon-outline" label="المظهر" value="داكن" />
          <Setting icon="shield-checkmark-outline" label="الخصوصية والأمان" value="إدارة البيانات" />
          <Setting icon="help-circle-outline" label="المساعدة والدعم" value="تواصل معنا" />
        </View>
      </ScrollView>
    );
  }

  const content = tab === "home" ? <HomeScreen /> : tab === "search" ? <SearchScreen /> : tab === "library" ? <LibraryScreen /> : <ProfileScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.app}>{content}</View>
      <BottomTabs current={tab} onChange={setTab} />
      <WorkModal libraryIds={libraryIds} onClose={() => setSelectedWork(null)} onToggle={toggleWork} work={selectedWork} />
      <ReaderModal onClose={() => setSelectedReader(null)} onToggle={toggleReader} reader={selectedReader} />
    </SafeAreaView>
  );
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionAction}>{action}</Text></View>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Setting({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <Pressable style={styles.setting}><View style={styles.settingIcon}><Ionicons color={colors.accent} name={icon} size={19} /></View><View style={styles.settingCopy}><Text style={styles.settingLabel}>{label}</Text><Text style={styles.settingValue}>{value}</Text></View><Ionicons color={colors.muted} name="chevron-back" size={18} /></Pressable>;
}

function EmptyState({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return <View style={styles.empty}><Ionicons color={colors.muted} name={icon} size={34} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{text}</Text></View>;
}

function BottomTabs({ current, onChange }: { current: Tab; onChange: (tab: Tab) => void }) {
  const tabs: Array<{ id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: "home", label: "الرئيسية", icon: "home-outline" },
    { id: "search", label: "بحث", icon: "search-outline" },
    { id: "library", label: "مكتبتي", icon: "book-outline" },
    { id: "profile", label: "حسابي", icon: "person-outline" }
  ];
  return (
    <View style={styles.bottomTabs}>
      {tabs.map((tab) => {
        const active = current === tab.id;
        return <Pressable key={tab.id} onPress={() => onChange(tab.id)} style={styles.tab}><View style={[styles.tabIcon, active && styles.tabIconActive]}><Ionicons color={active ? colors.text : colors.muted} name={tab.icon} size={21} /></View><Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text></Pressable>;
      })}
    </View>
  );
}

function WorkModal({ work, libraryIds, onClose, onToggle }: { work: Work | null; libraryIds: string[]; onClose: () => void; onToggle: (id: string) => void }) {
  if (!work) return null;
  const saved = libraryIds.includes(work.id);
  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" transparent visible>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modal}>
          <View style={styles.modalBar} />
          <Pressable accessibilityLabel="إغلاق" onPress={onClose} style={styles.closeButton}><Ionicons color={colors.text} name="close" size={22} /></Pressable>
          <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.detailTop}><Cover work={work} size="hero" /><View style={styles.detailTopCopy}><TypePill type={work.type} /><Text style={styles.detailTitle}>{work.title}</Text><Text style={styles.meta}>{work.author} · {work.year}</Text><Score value={work.score} /></View></View>
            <Text style={styles.detailHeading}>القصة</Text><Text style={styles.detailText}>{work.synopsis}</Text>
            <View style={styles.progressCard}><View style={styles.progressHeading}><Text style={styles.progressTitle}>تقدم القراءة</Text><Text style={styles.progressText}>{work.progress} / {work.total}</Text></View><View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${Math.max(3, Math.min(100, (work.progress / work.total) * 100))}%` }]} /></View></View>
            {work.characters?.length ? <><Text style={styles.detailHeading}>الشخصيات</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.characterList}>{work.characters.map((character) => <View key={character.id} style={styles.character}><Image source={{ uri: character.image }} style={styles.characterImage} /><Text numberOfLines={1} style={styles.characterName}>{character.name}</Text><Text style={styles.characterRole}>{character.role}</Text></View>)}</ScrollView></> : null}
            <Pressable onPress={() => onToggle(work.id)} style={[styles.primaryButton, saved && styles.secondaryButton]}><Ionicons color={saved ? colors.text : colors.bg} name={saved ? "checkmark-circle" : "add-circle"} size={20} /><Text style={[styles.primaryButtonText, saved && styles.secondaryButtonText]}>{saved ? "موجود في مكتبتي" : "إضافة إلى مكتبتي"}</Text></Pressable>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ReaderModal({ reader, onClose, onToggle }: { reader: Reader | null; onClose: () => void; onToggle: (id: string) => void }) {
  if (!reader) return null;
  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" transparent visible>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.readerModal}>
          <View style={styles.modalBar} />
          <Pressable accessibilityLabel="إغلاق" onPress={onClose} style={styles.closeButton}><Ionicons color={colors.text} name="close" size={22} /></Pressable>
          <ReaderAvatar large reader={reader} />
          <Text style={styles.profileName}>{reader.name}</Text><Text style={styles.profileHandle}>@{reader.username}</Text><Text style={styles.readerBio}>{reader.bio}</Text>
          <View style={styles.genreList}>{reader.genres.map((genre) => <View key={genre} style={styles.genre}><Text style={styles.genreText}>{genre}</Text></View>)}</View>
          <Pressable onPress={() => onToggle(reader.id)} style={[styles.primaryButton, reader.following && styles.secondaryButton]}><Ionicons color={reader.following ? colors.text : colors.bg} name={reader.following ? "checkmark-circle" : "person-add"} size={20} /><Text style={[styles.primaryButtonText, reader.following && styles.secondaryButtonText]}>{reader.following ? "إلغاء المتابعة" : "متابعة"}</Text></Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, paddingTop: NativeStatusBar.currentHeight ?? 0 },
  app: { alignSelf: "center", backgroundColor: colors.bg, flex: 1, maxWidth: 560, width: "100%" },
  screenFill: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 122 },
  homeHeader: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 22 },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: "700", textAlign: "right" },
  homeTitle: { color: colors.text, fontSize: 24, fontWeight: "900", marginTop: 3, textAlign: "right" },
  accentText: { color: colors.accent },
  iconButton: { alignItems: "center", backgroundColor: colors.raised, borderColor: colors.border, borderRadius: 18, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  featured: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, flexDirection: "row-reverse", overflow: "hidden", padding: 14 },
  heroCover: { backgroundColor: colors.raised, borderRadius: 13, height: 184, width: 122 },
  featuredBody: { flex: 1, justifyContent: "center", paddingRight: 14 },
  featuredLabel: { alignItems: "center", flexDirection: "row-reverse", gap: 5, marginBottom: 8 },
  featuredLabelText: { color: colors.gold, fontSize: 11, fontWeight: "800" },
  featuredTitle: { color: colors.text, fontSize: 22, fontWeight: "900", textAlign: "right" },
  featuredText: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 7, textAlign: "right" },
  featuredFooter: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 13 },
  continueText: { color: colors.accent, fontSize: 12, fontWeight: "800" },
  sectionHeader: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 12, marginTop: 28 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900", textAlign: "right" },
  sectionAction: { color: colors.accent, fontSize: 12, fontWeight: "800" },
  horizontalList: { flexDirection: "row-reverse", gap: 12, paddingHorizontal: 1 },
  horizontalWork: { width: 126 },
  cover: { backgroundColor: colors.raised, borderRadius: 14, height: 178, width: 126 },
  horizontalWorkBody: { paddingTop: 8 },
  cardTitle: { color: colors.text, fontSize: 13, fontWeight: "800", lineHeight: 18, minHeight: 36, textAlign: "right" },
  typePill: { alignSelf: "flex-start", backgroundColor: colors.accentSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  typePillText: { color: "#d6b6ff", fontSize: 10, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: "right" },
  scoreRow: { alignItems: "center", flexDirection: "row-reverse", gap: 4, marginTop: 6 },
  scoreText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  workRow: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row-reverse", minHeight: 100, paddingVertical: 12 },
  rowCover: { backgroundColor: colors.raised, borderRadius: 10, height: 76, width: 53 },
  workRowBody: { flex: 1, paddingHorizontal: 12 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: "900", marginTop: 5, textAlign: "right" },
  addButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 15, height: 36, justifyContent: "center", width: 36 },
  addButtonSaved: { backgroundColor: colors.green },
  searchHeader: { backgroundColor: colors.bg, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, padding: 20, paddingBottom: 13 },
  screenTitle: { color: colors.text, fontSize: 29, fontWeight: "900", textAlign: "right" },
  searchBox: { alignItems: "center", backgroundColor: colors.raised, borderColor: colors.border, borderRadius: 15, borderWidth: 1, flexDirection: "row-reverse", gap: 8, marginTop: 16, paddingHorizontal: 13 },
  searchInput: { color: colors.text, flex: 1, fontSize: 14, height: 48, textAlign: "right" },
  chips: { flexDirection: "row-reverse", gap: 8, paddingTop: 13 },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: colors.bg },
  searchResults: { padding: 20, paddingBottom: 122 },
  readerSearchSection: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginBottom: 19, overflow: "hidden", paddingHorizontal: 13 },
  readerSearchHeading: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", paddingVertical: 12 },
  resultCount: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  readerRow: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row-reverse", paddingVertical: 10 },
  readerAvatar: { alignItems: "center", backgroundColor: colors.accent, borderColor: "#e7d1ff", borderRadius: 24, borderWidth: 2, height: 44, justifyContent: "center", overflow: "hidden", width: 44 },
  readerAvatarLarge: { borderRadius: 42, height: 80, marginBottom: 13, width: 80 },
  readerAvatarText: { color: colors.text, fontSize: 18, fontWeight: "900" },
  readerAvatarTextLarge: { fontSize: 32 },
  avatarImage: { height: "100%", width: "100%" },
  readerRowCopy: { flex: 1, paddingHorizontal: 10 },
  readerName: { color: colors.text, fontSize: 14, fontWeight: "900", textAlign: "right" },
  readerHandle: { color: colors.muted, fontSize: 11, marginTop: 2, textAlign: "right" },
  followState: { backgroundColor: colors.raised, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  followStateOn: { backgroundColor: colors.accentSoft },
  followStateText: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  followStateTextOn: { color: "#d6b6ff" },
  resultsHeading: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 2 },
  pageTop: { marginBottom: 12 },
  pageSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "right" },
  empty: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 34, padding: 32 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 12, marginTop: 5, textAlign: "center" },
  profileHero: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 22 },
  mark: { alignItems: "center", backgroundColor: colors.accentSoft, borderColor: colors.accent, borderWidth: 1, justifyContent: "center" },
  markText: { color: "#e5ccff", fontWeight: "900" },
  profileName: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 4, textAlign: "center" },
  profileHandle: { color: colors.muted, fontSize: 13, marginTop: 3, textAlign: "center" },
  profileBio: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 15, textAlign: "center" },
  profileStats: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row-reverse", marginTop: 19, paddingTop: 16, width: "100%" },
  stat: { flex: 1 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "900", textAlign: "center" },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: "center" },
  settingsCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 30, overflow: "hidden" },
  setting: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row-reverse", padding: 14 },
  settingIcon: { alignItems: "center", backgroundColor: colors.accentSoft, borderRadius: 11, height: 38, justifyContent: "center", width: 38 },
  settingCopy: { flex: 1, paddingHorizontal: 11 },
  settingLabel: { color: colors.text, fontSize: 14, fontWeight: "800", textAlign: "right" },
  settingValue: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: "right" },
  bottomTabs: { backgroundColor: "#111015", borderColor: colors.border, borderRadius: 23, borderWidth: 1, bottom: 16, flexDirection: "row-reverse", left: 14, padding: 6, position: "absolute", right: 14 },
  tab: { alignItems: "center", flex: 1, gap: 3, paddingVertical: 4 },
  tabIcon: { alignItems: "center", borderRadius: 13, height: 31, justifyContent: "center", width: 44 },
  tabIconActive: { backgroundColor: colors.accent },
  tabLabel: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  tabLabelActive: { color: colors.text },
  modalSafe: { backgroundColor: "rgba(0,0,0,.65)", flex: 1, justifyContent: "flex-end" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 27, borderTopRightRadius: 27, maxHeight: "89%", minHeight: "66%" },
  readerModal: { alignItems: "center", backgroundColor: colors.surface, borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 22 },
  modalBar: { alignSelf: "center", backgroundColor: colors.border, borderRadius: 99, height: 5, marginBottom: 8, width: 42 },
  closeButton: { alignItems: "center", backgroundColor: colors.raised, borderRadius: 18, height: 36, justifyContent: "center", left: 18, position: "absolute", top: 20, width: 36, zIndex: 2 },
  detailScroll: { padding: 21, paddingTop: 8 },
  detailTop: { flexDirection: "row-reverse", gap: 15 },
  detailTopCopy: { flex: 1, justifyContent: "center" },
  detailTitle: { color: colors.text, fontSize: 23, fontWeight: "900", marginTop: 8, textAlign: "right" },
  detailHeading: { color: colors.text, fontSize: 18, fontWeight: "900", marginTop: 27, textAlign: "right" },
  detailText: { color: colors.muted, fontSize: 14, lineHeight: 23, marginTop: 8, textAlign: "right" },
  progressCard: { backgroundColor: colors.raised, borderRadius: 15, marginTop: 21, padding: 14 },
  progressHeading: { flexDirection: "row-reverse", justifyContent: "space-between" },
  progressTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
  progressText: { color: colors.muted, fontSize: 12 },
  progressTrack: { backgroundColor: colors.border, borderRadius: 99, height: 6, marginTop: 11, overflow: "hidden" },
  progressValue: { backgroundColor: colors.accent, borderRadius: 99, height: "100%" },
  characterList: { marginTop: 12 },
  character: { marginLeft: 12, width: 72 },
  characterImage: { backgroundColor: colors.raised, borderRadius: 36, height: 64, width: 64 },
  characterName: { color: colors.text, fontSize: 10, fontWeight: "800", marginTop: 6, textAlign: "center" },
  characterRole: { color: colors.muted, fontSize: 9, marginTop: 2, textAlign: "center" },
  primaryButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 14, flexDirection: "row-reverse", gap: 8, justifyContent: "center", marginTop: 30, padding: 14 },
  primaryButtonText: { color: colors.bg, fontSize: 14, fontWeight: "900" },
  secondaryButton: { backgroundColor: colors.raised, borderColor: colors.border, borderWidth: 1 },
  secondaryButtonText: { color: colors.text },
  readerBio: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 17, textAlign: "center" },
  genreList: { flexDirection: "row-reverse", gap: 7, marginTop: 14 },
  genre: { backgroundColor: colors.accentSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  genreText: { color: "#d6b6ff", fontSize: 11, fontWeight: "800" }
});
